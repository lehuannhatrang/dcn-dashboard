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

import i18nInstance from '@/utils/i18n';
import { FC } from 'react';
import { Modal, Form, Select, Input } from 'antd';
import { CreateClusterNamespace } from '@/services/namespace.ts';
import { IResponse } from '@/services/base.ts';
import { useCluster } from '@/hooks';
interface NewNamespaceModalProps {
  open?: boolean;
  onOk?: (ret: IResponse<string>) => Promise<void>;
  onCancel?: () => Promise<void> | void;
}

const NewNamespaceModal: FC<NewNamespaceModalProps> = (props) => {
  const { open, onOk, onCancel } = props;
  const [form] = Form.useForm<{
    name: string;
    cluster: string;
  }>();
  
  const { clusterOptions, isClusterDataLoading } = useCluster({allowSelectAll: false});

  return (
    <Modal
      open={open}
      title={i18nInstance.t('ac2f01145a5c4a9aaaf2f828650d91a3', '新增命名空间')}
      width={600}
      okText={i18nInstance.t('38cf16f2204ffab8a6e0187070558721', '确定')}
      cancelText={i18nInstance.t('625fb26b4b3340f7872b411f401e754c', '取消')}
      onOk={async () => {
        try {
          const submitData = await form.validateFields();
          const ret = await CreateClusterNamespace(submitData);
          if (ret.code === 200) {
            form.resetFields();
          }
          onOk && (await onOk(ret));
        } catch (e) {
          console.log('e', e);
        }
      }}
      onCancel={async () => {
        form.resetFields();
        onCancel && (await onCancel());
      }}
      destroyOnClose={true}
    >
      <Form
        form={form}
        className={'h-[100px]'}
        validateMessages={{
          required: i18nInstance.t(
            'e0a23c19b8a0044c5defd167b441d643',
            "'${name}' 是必选字段",
          ),
        }}
      >
        <Form.Item
          label={i18nInstance.t(
            '06ff2e9eba7ae422587c6536e337395f',
            '命名空间名称',
          )}
          name="name"
          required
          rules={[{ required: true }]}
        >
          <Input
            placeholder={i18nInstance.t(
              '6375184207a6497c71d305f93908c8a1',
              '请输入命名空间名称',
            )}
          />
        </Form.Item>
        <Form.Item
          label='Cluster'
          name="cluster"
          required
          rules={[{ required: true }]}
        >
          <Select
            options={clusterOptions.map(item => ({label: item.label, value: item.label}))}
            loading={isClusterDataLoading}
            showSearch
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default NewNamespaceModal;
