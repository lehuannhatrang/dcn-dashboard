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

package pod

import (
	"context"

	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// PodDetail is a pod detail
type PodDetail struct {
	ObjectMeta metaV1.ObjectMeta `json:"objectMeta"`
	TypeMeta   metaV1.TypeMeta   `json:"typeMeta"`
	Spec       v1.PodSpec        `json:"podSpec"`
	Status     v1.PodStatus      `json:"status"`
}

// GetPodDetail returns a Pod detail
func GetPodDetail(client kubernetes.Interface, namespace, name string) (*v1.Pod, error) {
	podData, err := client.CoreV1().Pods(namespace).Get(context.TODO(), name, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}
	return podData, nil
}
