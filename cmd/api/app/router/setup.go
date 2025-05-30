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

package router

import (
	"github.com/gin-gonic/gin"

	"github.com/karmada-io/dashboard/pkg/environment"
)

var (
	router *gin.Engine
	v1     *gin.RouterGroup
	member *gin.RouterGroup
	mgmt   *gin.RouterGroup
)

func init() {
	if !environment.IsDev() {
		gin.SetMode(gin.ReleaseMode)
	}

	router = gin.Default()
	_ = router.SetTrustedProxies(nil)
	v1 = router.Group("/api/v1")
	
	// Member cluster routes with middleware to ensure cluster exists
	member = v1.Group("/member/:clustername")
	member.Use(EnsureMemberClusterMiddleware())
	
	// Management cluster routes with admin middleware
	mgmt = v1.Group("/mgmt-cluster")
	mgmt.Use(EnsureMgmtAdminMiddleware())

	router.GET("/livez", func(c *gin.Context) {
		c.String(200, "livez")
	})
	router.GET("/readyz", func(c *gin.Context) {
		c.String(200, "readyz")
	})
}

// V1 returns the router group for /api/v1 which for resources in control plane endpoints.
func V1() *gin.RouterGroup {
	return v1
}

// Router returns the main Gin engine instance.
func Router() *gin.Engine {
	return router
}

// MemberV1 returns the router group for /api/v1/member/:clustername which for resources in specific member cluster.
func MemberV1() *gin.RouterGroup {
	return member
}

// Mgmt returns the router group for /api/v1/mgmt-cluster which for resources in management cluster.
func Mgmt() *gin.RouterGroup {
	return mgmt
}
