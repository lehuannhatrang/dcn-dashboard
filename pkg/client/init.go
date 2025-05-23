/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package client

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"

	"github.com/karmada-io/dashboard/pkg/auth/fga"
	karmadaclientset "github.com/karmada-io/karmada/pkg/generated/clientset/versioned"
	kubeclient "k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	"k8s.io/klog/v2"
)

const proxyURL = "/apis/cluster.karmada.io/v1alpha1/clusters/%s/proxy/"

var (
	kubernetesRestConfig               *rest.Config
	kubernetesAPIConfig                *clientcmdapi.Config
	inClusterClient                    kubeclient.Interface
	karmadaRestConfig                  *rest.Config
	karmadaAPIConfig                   *clientcmdapi.Config
	karmadaMemberConfig                *rest.Config
	inClusterKarmadaClient             karmadaclientset.Interface
	inClusterClientForKarmadaAPIServer kubeclient.Interface
	inClusterClientForMemberAPIServer  kubeclient.Interface
	memberClients                      sync.Map
	// CurrentUser stores the username for permission checks when context isn't available
	CurrentUser string
	// CurrentUserMutex protects concurrent access to CurrentUser
	CurrentUserMutex sync.RWMutex
)

type configBuilder struct {
	kubeconfigPath string
	kubeContext    string
	insecure       bool
	userAgent      string
}

// Option is a function that configures a configBuilder.
type Option func(*configBuilder)

// WithUserAgent is an option to set the user agent.
func WithUserAgent(agent string) Option {
	return func(c *configBuilder) {
		c.userAgent = agent
	}
}

// WithKubeconfig is an option to set the kubeconfig path.
func WithKubeconfig(path string) Option {
	return func(c *configBuilder) {
		c.kubeconfigPath = path
	}
}

// WithKubeContext is an option to set the kubeconfig context.
func WithKubeContext(kubecontext string) Option {
	return func(c *configBuilder) {
		c.kubeContext = kubecontext
	}
}

// WithInsecureTLSSkipVerify is an option to set the insecure tls skip verify.
func WithInsecureTLSSkipVerify(insecure bool) Option {
	return func(c *configBuilder) {
		c.insecure = insecure
	}
}

func newConfigBuilder(options ...Option) *configBuilder {
	builder := &configBuilder{}

	for _, opt := range options {
		opt(builder)
	}

	return builder
}

func (in *configBuilder) buildRestConfig() (*rest.Config, error) {
	if len(in.kubeconfigPath) == 0 {
		return nil, errors.New("must specify kubeconfig")
	}
	klog.InfoS("Using kubeconfig", "kubeconfig", in.kubeconfigPath)

	restConfig, err := LoadRestConfig(in.kubeconfigPath, in.kubeContext)
	if err != nil {
		return nil, err
	}

	restConfig.QPS = DefaultQPS
	restConfig.Burst = DefaultBurst
	// TODO: make clear that why karmada apiserver seems only can use application/json, however kubernetest apiserver can use "application/vnd.kubernetes.protobuf"
	restConfig.UserAgent = DefaultUserAgent + "/" + in.userAgent
	restConfig.TLSClientConfig.Insecure = in.insecure

	return restConfig, nil
}

func (in *configBuilder) buildAPIConfig() (*clientcmdapi.Config, error) {
	if len(in.kubeconfigPath) == 0 {
		return nil, errors.New("must specify kubeconfig")
	}
	klog.InfoS("Using kubeconfig", "kubeconfig", in.kubeconfigPath)
	apiConfig, err := LoadAPIConfig(in.kubeconfigPath, in.kubeContext)
	if err != nil {
		return nil, err
	}
	return apiConfig, nil
}

func isKubeInitialized() bool {
	if kubernetesRestConfig == nil || kubernetesAPIConfig == nil {
		klog.Errorf(`karmada/karmada-dashboard/client' package has not been initialized properly. Run 'client.InitKubeConfig(...)' to initialize it. `)
		return false
	}
	return true
}

// InitKubeConfig initializes the kubernetes client config.
func InitKubeConfig(options ...Option) {
	builder := newConfigBuilder(options...)
	// prefer InClusterConfig, if something wrong, use explicit kubeconfig path
	restConfig, err := rest.InClusterConfig()
	if err == nil {
		klog.Infof("InitKubeConfig by InClusterConfig method")
		restConfig.UserAgent = DefaultUserAgent + "/" + builder.userAgent
		restConfig.TLSClientConfig.Insecure = builder.insecure
		kubernetesRestConfig = restConfig

		apiConfig := ConvertRestConfigToAPIConfig(restConfig)
		kubernetesAPIConfig = apiConfig
	} else {
		klog.Infof("InClusterConfig error: %+v", err)
		klog.Infof("InitKubeConfig by explicit kubeconfig path")
		restConfig, err = builder.buildRestConfig()
		if err != nil {
			klog.Errorf("Could not init client config: %s", err)
			os.Exit(1)
		}
		kubernetesRestConfig = restConfig
		apiConfig, err := builder.buildAPIConfig()
		if err != nil {
			klog.Errorf("Could not init api config: %s", err)
			os.Exit(1)
		}
		kubernetesAPIConfig = apiConfig
	}
}

// InClusterClient returns a kubernetes client.
func InClusterClient() kubeclient.Interface {
	if !isKubeInitialized() {
		return nil
	}

	if inClusterClient != nil {
		return inClusterClient
	}

	// init on-demand only
	c, err := kubeclient.NewForConfig(kubernetesRestConfig)
	if err != nil {
		klog.ErrorS(err, "Could not init kubernetes in-cluster client")
		os.Exit(1)
	}
	// initialize in-memory client
	inClusterClient = c
	return inClusterClient
}

// GetKubeConfig returns the kubernetes client config.
func GetKubeConfig() (*rest.Config, *clientcmdapi.Config, error) {
	if !isKubeInitialized() {
		return nil, nil, fmt.Errorf("client package not initialized")
	}
	return kubernetesRestConfig, kubernetesAPIConfig, nil
}

func isKarmadaInitialized() bool {
	if karmadaRestConfig == nil || karmadaAPIConfig == nil {
		klog.Errorf(`karmada/karmada-dashboard/client' package has not been initialized properly. Run 'client.InitKarmadaConfig(...)' to initialize it. `)
		return false
	}
	return true
}

// InitKarmadaConfig initializes the karmada client config.
func InitKarmadaConfig(options ...Option) {
	builder := newConfigBuilder(options...)
	restConfig, err := builder.buildRestConfig()
	if err != nil {
		klog.Errorf("Could not init client config: %s", err)
		os.Exit(1)
	}
	karmadaRestConfig = restConfig

	apiConfig, err := builder.buildAPIConfig()
	if err != nil {
		klog.Errorf("Could not init api config: %s", err)
		os.Exit(1)
	}
	karmadaAPIConfig = apiConfig

	memberConfig, err := builder.buildRestConfig()
	if err != nil {
		klog.Errorf("Could not init member config: %s", err)
		os.Exit(1)
	}
	karmadaMemberConfig = memberConfig
}

// InClusterKarmadaClient returns a karmada client.
func InClusterKarmadaClient() karmadaclientset.Interface {
	if !isKarmadaInitialized() {
		return nil
	}
	if inClusterKarmadaClient != nil {
		return inClusterKarmadaClient
	}
	// init on-demand only
	c, err := karmadaclientset.NewForConfig(karmadaRestConfig)
	if err != nil {
		klog.ErrorS(err, "Could not init karmada in-cluster client")
		os.Exit(1)
	}
	// initialize in-memory client
	inClusterKarmadaClient = c
	return inClusterKarmadaClient
}

// GetKarmadaConfig returns the karmada client config.
func GetKarmadaConfig() (*rest.Config, *clientcmdapi.Config, error) {
	if !isKarmadaInitialized() {
		return nil, nil, fmt.Errorf("client package not initialized")
	}
	return karmadaRestConfig, karmadaAPIConfig, nil
}

// GetMemberConfig returns the member client config.
func GetMemberConfig() (*rest.Config, error) {
	if !isKarmadaInitialized() {
		return nil, fmt.Errorf("client package not initialized")
	}
	return karmadaMemberConfig, nil
}

// InClusterClientForKarmadaAPIServer returns a kubernetes client for karmada apiserver.
func InClusterClientForKarmadaAPIServer() kubeclient.Interface {
	if !isKarmadaInitialized() {
		return nil
	}
	if inClusterClientForKarmadaAPIServer != nil {
		return inClusterClientForKarmadaAPIServer
	}
	restConfig, _, err := GetKarmadaConfig()
	if err != nil {
		klog.ErrorS(err, "Could not get karmada restConfig")
		return nil
	}
	c, err := kubeclient.NewForConfig(restConfig)
	if err != nil {
		klog.ErrorS(err, "Could not init kubernetes in-cluster client for karmada apiserver")
		return nil
	}
	inClusterClientForKarmadaAPIServer = c
	return inClusterClientForKarmadaAPIServer
}

// InClusterClientForMemberCluster returns a kubernetes client for member apiserver.
func InClusterClientForMemberCluster(clusterName string) kubeclient.Interface {
	if !isKarmadaInitialized() {
		return nil
	}

	// If requesting the management cluster, return the direct client
	if clusterName == "mgmt-cluster" {
		return InClusterClient()
	}

	// Check permissions if we have a cluster name and a current user
	if clusterName != "" {
		// Get current username for permission check
		CurrentUserMutex.RLock()
		username := CurrentUser
		CurrentUserMutex.RUnlock()
		if username != "" && fga.FGAService != nil && fga.FGAService.GetClient() != nil {
			// Check if the user has access to this cluster
			allowed, err := fga.HasClusterAccess(context.Background(), fga.FGAService.GetClient(), username, clusterName)
			if err != nil {
				klog.ErrorS(err, "Failed to check cluster access", "user", username, "cluster", clusterName)
				return nil
			}
			if !allowed {
				klog.InfoS("Access denied", "user", username, "cluster", clusterName)
				return nil
			}
		}
	}

	// Load and return Interface for member apiserver if already exist
	if value, ok := memberClients.Load(clusterName); ok {
		if inClusterClientForMemberAPIServer, ok = value.(kubeclient.Interface); ok {
			return inClusterClientForMemberAPIServer
		}
		klog.Error("Could not get client for member apiserver")
		return nil
	}

	// Client for new member apiserver
	restConfig, _, err := GetKarmadaConfig()
	if err != nil {
		klog.ErrorS(err, "Could not get karmada restConfig")
		return nil
	}
	memberConfig, err := GetMemberConfig()
	if err != nil {
		klog.ErrorS(err, "Could not get member restConfig")
		return nil
	}
	memberConfig.Host = restConfig.Host + fmt.Sprintf(proxyURL, clusterName)
	c, err := kubeclient.NewForConfig(memberConfig)
	if err != nil {
		klog.ErrorS(err, "Could not init kubernetes in-cluster client for member apiserver")
		return nil
	}
	inClusterClientForMemberAPIServer = c
	memberClients.Store(clusterName, inClusterClientForMemberAPIServer)
	return inClusterClientForMemberAPIServer
}

// ConvertRestConfigToAPIConfig converts a rest.Config to a clientcmdapi.Config.
func ConvertRestConfigToAPIConfig(restConfig *rest.Config) *clientcmdapi.Config {
	// 将 rest.Config 转换为 clientcmdapi.Config
	clientcmdConfig := clientcmdapi.NewConfig()
	clientcmdConfig.Clusters["clusterName"] = &clientcmdapi.Cluster{
		Server:                   restConfig.Host,
		InsecureSkipTLSVerify:    restConfig.Insecure,
		CertificateAuthorityData: restConfig.TLSClientConfig.CAData,
	}

	clientcmdConfig.AuthInfos["authInfoName"] = &clientcmdapi.AuthInfo{
		ClientCertificateData: restConfig.TLSClientConfig.CertData,
		ClientKeyData:         restConfig.TLSClientConfig.KeyData,
	}
	clientcmdConfig.Contexts["contextName"] = &clientcmdapi.Context{
		Cluster:  "clusterName",
		AuthInfo: "authInfoName",
	}
	clientcmdConfig.CurrentContext = "contextName"
	return clientcmdConfig
}

// SetCurrentUser sets the current user for permission checks
// This should be called during authentication to ensure username is available for cluster access checks
func SetCurrentUser(username string) {
	CurrentUserMutex.Lock()
	defer CurrentUserMutex.Unlock()
	CurrentUser = username
	klog.V(4).InfoS("Current user set", "username", username)
}

// GetCurrentUser returns the currently set username
func GetCurrentUser() string {
	CurrentUserMutex.RLock()
	defer CurrentUserMutex.RUnlock()
	return CurrentUser
}
