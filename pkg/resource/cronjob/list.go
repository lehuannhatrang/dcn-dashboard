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

package cronjob

import (
	"fmt"
	"log"

	batch "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"

	"github.com/karmada-io/dashboard/pkg/common/errors"
	"github.com/karmada-io/dashboard/pkg/common/types"
	"github.com/karmada-io/dashboard/pkg/dataselect"
	"github.com/karmada-io/dashboard/pkg/resource/common"
)

// CronJobList contains a list of CronJobs in the cluster.
type CronJobList struct {
	ListMeta types.ListMeta `json:"listMeta"`
	Items    []CronJob      `json:"items"`

	// Basic information about resources status on the list.
	Status common.ResourceStatus `json:"status"`

	// List of non-critical errors, that occurred during resource retrieval.
	Errors []error `json:"errors"`
}

// CronJob is a presentation layer view of Kubernetes Cron Job resource.
type CronJob struct {
	ObjectMeta   types.ObjectMeta `json:"objectMeta"`
	TypeMeta     types.TypeMeta   `json:"typeMeta"`
	Schedule     string           `json:"schedule"`
	Suspend      *bool            `json:"suspend"`
	Active       int              `json:"active"`
	LastSchedule *metav1.Time     `json:"lastSchedule"`

	// ContainerImages holds a list of the CronJob images.
	ContainerImages []string `json:"containerImages"`
}

// GetCronJobList returns a list of all CronJobs in the cluster.
func GetCronJobList(client client.Interface, nsQuery *common.NamespaceQuery,
	dsQuery *dataselect.DataSelectQuery) (*CronJobList, error) {
	// Handle nil client to prevent panic
	if client == nil {
		return nil, fmt.Errorf("kubernetes client is nil")
	}
	
	log.Print("Getting list of all cron jobs in the cluster")

	channels := &common.ResourceChannels{
		CronJobList: common.GetCronJobListChannel(client, nsQuery, 1),
	}

	return GetCronJobListFromChannels(channels, dsQuery)
}

// GetCronJobListFromChannels returns a list of all CronJobs in the cluster reading required resource
// list once from the channels.
func GetCronJobListFromChannels(channels *common.ResourceChannels, dsQuery *dataselect.DataSelectQuery) (*CronJobList, error) {
	cronJobs := <-channels.CronJobList.List
	err := <-channels.CronJobList.Error
	nonCriticalErrors, criticalError := errors.ExtractErrors(err)
	if criticalError != nil {
		return nil, criticalError
	}

	cronJobList := toCronJobList(cronJobs.Items, nonCriticalErrors, dsQuery)
	cronJobList.Status = getStatus(cronJobs)
	return cronJobList, nil
}

func toCronJobList(cronJobs []batch.CronJob, nonCriticalErrors []error, dsQuery *dataselect.DataSelectQuery) *CronJobList {
	list := &CronJobList{
		Items:    make([]CronJob, 0),
		ListMeta: types.ListMeta{TotalItems: len(cronJobs)},
		Errors:   nonCriticalErrors,
	}

	cronJobCells, filteredTotal := dataselect.GenericDataSelectWithFilter(ToCells(cronJobs), dsQuery)
	cronJobs = FromCells(cronJobCells)
	list.ListMeta = types.ListMeta{TotalItems: filteredTotal}

	for _, cronJob := range cronJobs {
		list.Items = append(list.Items, toCronJob(&cronJob))
	}

	return list
}

func toCronJob(cj *batch.CronJob) CronJob {
	return CronJob{
		ObjectMeta:      types.NewObjectMeta(cj.ObjectMeta),
		TypeMeta:        types.NewTypeMeta(types.ResourceKindCronJob),
		Schedule:        cj.Spec.Schedule,
		Suspend:         cj.Spec.Suspend,
		Active:          len(cj.Status.Active),
		LastSchedule:    cj.Status.LastScheduleTime,
		ContainerImages: getContainerImages(cj),
	}
}
