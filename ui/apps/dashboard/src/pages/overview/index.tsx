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
  Col,
  Row,
  Spin,
  Flex
} from 'antd';

import { GaugeChart } from '@/components/chart';
import { GetOverview } from '@/services/overview.ts';
import { InfoCard, SectionCard } from '@/components/cards';
import Panel from '@/components/panel';
import i18nInstance from '@/utils/i18n';
import { useQuery } from '@tanstack/react-query';
import { GetClusters } from '@/services';
import { Icons } from '@/components/icons';

const Overview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['GetOverview'],
    queryFn: async () => {
      const ret = await GetOverview();
      return ret.data;
    },
  });

  const { data: clusters } = useQuery({
    queryKey: ['GetClusters'],
    queryFn: async () => {
      const ret = await GetClusters();
      return ret.data;
    },
  });

  const grafanaUrl = 'http://192.168.28.135:31000/grafana/d/W2gX2zHVk/demo-dashboard?orgId=1&from=2025-02-21T09:22:42.348Z&to=2025-02-21T10:22:42.348Z&var-service=frontend&theme=light';

  const { allocatedCPU, totalCPU } = data?.memberClusterStatus.cpuSummary || {};
  const { allocatedMemory, totalMemory } = data?.memberClusterStatus.memorySummary || {};
  const allocatedMemoryGiB = allocatedMemory && allocatedMemory / 8 / 1024 / 1024;
  const totalMemoryGiB = totalMemory && totalMemory / 8 / 1024 / 1024;

  return (
    <Spin spinning={isLoading}>
      <Panel>
        <Row gutter={32}>
          <Col span={12}>
            <Row gutter={32} className="mb-8">
              <Col span={8}>
                <InfoCard label={'Cluster'} value={clusters?.clusters.length || '-'} />
              </Col>
              <Col span={8}>
                <InfoCard
                  label={'Node'}
                  value={`${data?.memberClusterStatus.nodeSummary.readyNum || '-'
                    }/${data?.memberClusterStatus.nodeSummary.totalNum || '-'}`}
                />
              </Col>
              <Col span={8}>
                <InfoCard
                  label={'Pod'}
                  value={`${data?.memberClusterStatus.podSummary.allocatedPod || '-'
                    }/${data?.memberClusterStatus.podSummary.totalPod || '-'}`}
                />
              </Col>
            </Row>
            <Row gutter={32}>
              <Col span={8}>
                <InfoCard
                  label={i18nInstance.t(
                    'a95abe7b8eeb55427547e764bf39f1c4',
                    '调度策略',
                  )}
                  value={data?.clusterResourceStatus.propagationPolicyNum}
                />
              </Col>
              <Col span={8}>
                <InfoCard
                  label={i18nInstance.t(
                    '0a7e9443c41575378d2db1e288d3f1cb',
                    '差异化策略',
                  )}
                  value={data?.clusterResourceStatus.overridePolicyNum}
                />
              </Col>
              <Col span={8}>
                <InfoCard
                  label={i18nInstance.t(
                    '66e8579fa53a0cdf402e882a3574a380',
                    'Karmada版本',
                  )}
                  value={data?.karmadaInfo.version.gitVersion || '-'}
                />
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <Row gutter={32}>
              <Col span={12}>
                <Row>
                  <b>
                    {i18nInstance.t(
                      'a1dacced95ddca3603110bdb1ae46af1',
                      'CPU使用情况',
                    )}
                  </b>
                </Row>
                <Row>
                  {totalCPU && allocatedCPU && (
                    <GaugeChart
                      data={{
                        target: allocatedCPU,
                        total: totalCPU,
                        name: 'CPU',
                        thresholds: [
                          totalCPU / 4,
                          totalCPU / 2,
                          (3 * totalCPU) / 4,
                          totalCPU,
                        ],
                      }}
                      config={{
                        height: 300,
                        style: {
                          textContent: (target: number, total: number) =>
                            total ? `${(Number((target / total).toFixed(4)) * 100).toFixed(2)}%` : '-'
                        },
                      }}
                    />
                  )}
                </Row>
              </Col>
              <Col span={12}>
                <Row>
                  <b>
                    {i18nInstance.t(
                      '5eaa09de6e55b322fcc299f641d73ce7',
                      'Memory使用情况',
                    )}
                  </b>
                </Row>
                <Row>
                  {totalMemoryGiB && allocatedMemoryGiB && (
                    <GaugeChart
                      data={{
                        target: allocatedMemoryGiB,
                        total: totalMemoryGiB,
                        name: 'Memory',
                        thresholds: [
                          totalMemoryGiB / 4,
                          totalMemoryGiB / 2,
                          (3 * totalMemoryGiB) / 4,
                          totalMemoryGiB,
                        ],
                      }}
                      config={{
                        height: 300,
                        style: {
                          textContent: (target: number, total: number) =>
                            total ? `${(Number((target / total).toFixed(4)) * 100).toFixed(2)}%` : '-'
                        },
                      }}
                    />
                  )}
                </Row>
              </Col>
              <Col span={12}></Col>
            </Row>
          </Col>
        </Row>

        <SectionCard label={(
          <Flex align='center'>
            <p style={{
              fontSize: '24px'
            }} className='mr-4' >Cluster metrics</p>
            <a href={grafanaUrl} target='_blank' rel="noreferrer" style={{color: '#1890ff', display: 'flex', fontSize: 16}}>
              Grafana
              <Icons.newTab style={{height: 20}} />
            </a>
          </Flex>
        )}>
          <iframe src={`${grafanaUrl}&kiosk`} width="100%" height="auto" style={{ minHeight: 1800, fontSize: '16px' }}></iframe>
        </SectionCard>
      </Panel>
    </Spin>
  );
};

export default Overview;
