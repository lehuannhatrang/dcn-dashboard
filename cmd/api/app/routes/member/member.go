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

package member

import (
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/argocd"           // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/configmap"        // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/cronjob"          // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/customresource"   // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/daemonset"        // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/deployment"       // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/ingress"          // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/job"              // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/namespace"        // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/node"             // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/overview"         // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/persistentvolume" // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/pod"              // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/replicaset"       // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/secret"           // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/service"          // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/statefulset"      // Importing member route packages forces route registration
	_ "github.com/karmada-io/dashboard/cmd/api/app/routes/member/unstructured"     // Importing member route packages forces route registration
)
