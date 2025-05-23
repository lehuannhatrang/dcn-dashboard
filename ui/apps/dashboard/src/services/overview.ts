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

import { ClusterOption } from '@/hooks/use-cluster';
import { IResponse, karmadaClient } from '@/services/base.ts';
import { getClusterApiPath } from '@/utils/cluster';

export interface OverviewInfo {
  karmadaInfo: KarmadaInfo;
  memberClusterStatus: MemberClusterStatus;
  clusterResourceStatus: ClusterResourceStatus;
  metricsDashboards: MetricsDashboard[] | null;
  argoMetrics: ArgoMetrics | null;
  deploymentCount?: number;
  namespaceCount?: number;
}

export interface ArgoMetrics {
  applicationCount: number;
  projectCount: number;
}

export interface KarmadaInfo {
  version: Version;
  status: string;
  createTime: string;
}

export interface Version {
  gitVersion: string;
  gitCommit: string;
  gitTreeState: string;
  buildDate: string;
  goVersion: string;
  compiler: string;
  platform: string;
}

export interface MemberClusterStatus {
  nodeSummary: NodeSummary;
  cpuSummary: CpuSummary;
  memorySummary: MemorySummary;
  podSummary: PodSummary;
}

export interface NodeSummary {
  totalNum: number;
  readyNum: number;
}

export interface CpuSummary {
  totalCPU: number;
  allocatedCPU: number;
}

export interface MemorySummary {
  totalMemory: number;
  allocatedMemory: number;
}

export interface PodSummary {
  totalPod: number;
  allocatedPod: number;
}

export interface ClusterResourceStatus {
  propagationPolicyNum: number;
  overridePolicyNum: number;
  namespaceNum: number;
  workloadNum: number;
  serviceNum: number;
  configNum: number;
}

export async function GetOverview(cluster: ClusterOption) {
  const url = getClusterApiPath(cluster.label, 'overview', false);
  const resp = await karmadaClient.get<IResponse<OverviewInfo>>(url);
  return resp.data;
}

export interface MetricsDashboard {
  name: string;
  url: string;
}