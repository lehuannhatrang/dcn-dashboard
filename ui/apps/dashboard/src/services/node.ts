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

import {
  DataSelectQuery,
  IResponse,
  ObjectMeta,
  Status,
  TypeMeta,
  convertDataSelectQuery,
  karmadaClient,
} from './base';
import { ClusterOption } from '@/hooks/use-cluster';
import { PodDetail } from './workload';
import { getClusterApiPath } from '@/utils/cluster';

export interface Node {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  status: Status;
}

export interface NodeEvent {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  message: string;
  sourceComponent: string;
  sourceHost: string;
  object: string;
  objectKind: string;
  objectName: string;
  objectNamespace: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  reason: string;
  type: string;
}


export async function GetNodes(query: DataSelectQuery, cluster?: ClusterOption) {
  const apiPath = getClusterApiPath(cluster?.label || '', 'node');
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      items: Node[];
    }>
  >(apiPath, {
    params: convertDataSelectQuery(query),
  });
  return resp.data;
}


export async function GetNodeDetail(params: {
  name: string;
  clusterName: string;
}) {
  const { name, clusterName } = params;
  const url = getClusterApiPath(clusterName, `node/${name}`);
  const resp = await karmadaClient.get<
    IResponse<
      {
        errors: string[];
      } & Node
    >
  >(url);
  return resp.data;
}

export async function GetNodeEvents(params: {
  name: string;
  clusterName: string;
}) {
  const { name, clusterName } = params;
  const url = getClusterApiPath(clusterName, `node/${name}/event`);
  const resp = await karmadaClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      events: NodeEvent[];
    }>
  >(url);
  return resp.data;
}

export async function GetNodePods(params: {
  name: string;
  clusterName: string;
}) {
  const { name, clusterName } = params;
  const url = getClusterApiPath(clusterName, `node/${name}/pod`);
  const resp = await karmadaClient.get<
    IResponse<{
      items: PodDetail[];
    }>
  >(url);
  return resp.data;
}