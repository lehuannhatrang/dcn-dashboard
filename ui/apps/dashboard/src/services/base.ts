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

import axios from 'axios';
import _ from 'lodash';

let pathPrefix = window.__path_prefix__ || '';
if (!pathPrefix.startsWith('/')) {
  pathPrefix = '/' + pathPrefix;
}
if (!pathPrefix.endsWith('/')) {
  pathPrefix = pathPrefix + '/';
}
export const routerBase = pathPrefix;
const baseURL: string = _.join([pathPrefix, 'api/v1'], '');

export const karmadaClient = axios.create({
  baseURL,
});

export interface IResponse<Data = {}> {
  code: number;
  message: string;
  data: Data;
}

export interface DataSelectQuery {
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}
export const convertDataSelectQuery = (query: DataSelectQuery) => {
  const dsQuery = {} as Record<string, string | number>;
  if (query.filterBy) {
    dsQuery['filterBy'] = query.filterBy.join(',');
  }
  if (query.sortBy) {
    dsQuery['sortBy'] = query.sortBy.join(',');
  }
  if (query.itemsPerPage && query.page) {
    dsQuery['itemsPerPage'] = query.itemsPerPage;
    dsQuery['page'] = query.page;
  }
  return dsQuery;
};

export type Labels = Record<string, string>;
export type Annotations = Record<string, string>;

export interface ObjectMeta {
  name: string;
  namespace: string;
  labels: Labels;
  annotations: Annotations;
  creationTimestamp: string;
  uid: string;
}

export interface TypeMeta {
  kind: string;
  scalable: boolean;
  restartable: boolean;
}

export type Status = {
  capacity: {
    cpu: string;
    'ephemeral-storage': string;
    'hugepages-1Gi': string;
    'hugepages-2Mi': string;
    memory: string;
    pods: string;
  };
  allocatable: {
    cpu: string;
    'ephemeral-storage': string;
    'hugepages-1Gi': string;
    'hugepages-2Mi': string;
    memory: string;
    pods: string;
  };
  conditions: {
    type: string;
    status: string;
    lastHeartbeatTime: string;
    lastTransitionTime: string;
    reason: string;
    message: string
  }[];
  addresses: {
    type: string;
    address: string
  }[];
  daemonEndpoints: {
    kubeletEndpoint: {
      port: number;
    }
  };
  nodeInfo: {
    machineID: string;
    systemUUID: string;
    bootID: string;
    kernelVersion: string;
    osImage: string;
    containerRuntimeVersion: string;
    kubeletVersion: string;
    kubeProxyVersion: string;
    operatingSystem: string;
    architecture: string
  }
}

export type Selector = Record<string, string>;

export interface RollingUpdateStrategy {
  maxSurge: string;
  maxUnavailable: string;
}

export enum WorkloadKind {
  Unknown = '',
  Deployment = 'deployment',
  Statefulset = 'statefulset',
  Daemonset = 'daemonset',
  ReplicaSet = 'replicaset',
  Cronjob = 'cronjob',
  Job = 'job',
  Pod = 'pod',
}

export enum ServiceKind {
  Unknown = '',
  Ingress = 'ingress',
  Service = 'service',
}

export enum ConfigKind {
  Unknown = '',
  Secret = 'secret',
  ConfigMap = 'configmap',
}

export enum PolicyScope {
  Namespace = 'namespace-scope',
  Cluster = 'cluster-scope',
}

export enum Mode {
  Create = 'create',
  Edit = 'edit',
  Detail = 'detail',
}

export const propagationpolicyKey = 'propagationpolicy.karmada.io/name';
// safely extract propagationpolicy
export const extractPropagationPolicy = (r: { objectMeta: ObjectMeta }) => {
  if (!r?.objectMeta?.annotations?.[propagationpolicyKey]) {
    return '';
  }
  return r?.objectMeta?.annotations?.[propagationpolicyKey];
};
