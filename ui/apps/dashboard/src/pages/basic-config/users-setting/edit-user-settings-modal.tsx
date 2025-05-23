import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Typography, Divider, Transfer, Flex } from 'antd';
import i18nInstance from '@/utils/i18n';
import { IResponse } from '@/services/base';
import { ClusterPermission, UserSetting, createUserSetting, updateUserSetting } from '@/services/user-setting';
import { useCluster } from '@/hooks';
import { ClusterOption } from '@/hooks/use-cluster';
import { USER_ROLE } from '@/services/auth';

interface UserSettingsModalProps {
  mode: 'create' | 'edit';
  open: boolean;
  initialData?: UserSetting;
  onCancel: () => Promise<void> | void;
  onOk: (ret: IResponse<any>) => Promise<void>;
}

const globalRoleOptions = [
  { label: 'Administrator', value: USER_ROLE.ADMIN},
  { label: 'Basic User', value: USER_ROLE.BASIC_USER },
];

const clusterRoleOptions = [
  { label: 'Owner', value: 'owner' },
  { label: 'Member', value: 'member' },
];

interface ClusterItem {
  key: string;
  title: string;
  description: string;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  mode,
  open,
  initialData,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm<UserSetting>();
  const [targetKeys, setTargetKeys] = useState<React.Key[]>([]);
  const [showClusterPermissions, setShowClusterPermissions] = useState<boolean>(false);
  const [clusterRoles, setClusterRoles] = useState<Record<string, string[]>>({});

  const { clusterOptions } = useCluster({allowSelectAll: false});

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
      setShowClusterPermissions(initialData.preferences?.role === USER_ROLE.BASIC_USER);
      // Initialize selected clusters if available
      if (initialData?.clusterPermissions) {
        try {
          const clusterPerms = initialData.clusterPermissions;
          setTargetKeys(Array.isArray(clusterPerms) ? clusterPerms.map(p => clusterOptions.find(c => c.label === p.cluster)?.value || '') : []);
          setClusterRoles(clusterPerms.reduce((acc, p) => {
            acc[p.cluster] = p.roles;
            return acc;
          }, {} as Record<string, string[]>));
        } catch (e) {
          setTargetKeys([]);
          setClusterRoles({});
        }
      }
    } else {
      form.resetFields();
      setTargetKeys([]);
      // Set default role for new users
      form.setFieldsValue({
        preferences: {
          role: USER_ROLE.BASIC_USER
        }
      });
      setShowClusterPermissions(true);
    }
  }, [initialData, form]);

  const handleRoleChange = (value: USER_ROLE) => {
    setShowClusterPermissions(value === USER_ROLE.BASIC_USER);
  };

  const handleTransferChange = (nextTargetKeys: React.Key[]) => {
    setTargetKeys(nextTargetKeys);
  };

  // Prepare cluster data for transfer component
  const clusterItems: ClusterItem[] = clusterOptions.map((cluster: ClusterOption) => ({
    key: cluster.value,
    title: cluster.label,
    description: cluster.label
  }));

  return (
    <Modal
      title={
        mode === 'create'
          ? 'Create User'
          : 'Edit User'
      }
      open={open}
      width={800}
      okText={i18nInstance.t('38cf16f2204ffab8a6e0187070558721', 'Save')}
      cancelText={i18nInstance.t('625fb26b4b3340f7872b411f401e754c', 'Cancel')}
      destroyOnClose={true}
      onOk={async () => {
        const submitData = await form.validateFields();
        const clusterPermissions: ClusterPermission[] = Object.entries(clusterRoles).map(([cluster, roles]) => ({
          cluster,
          roles
        }));
          
        // Add cluster permissions to form data if applicable
        if (showClusterPermissions && targetKeys.length > 0) {
          if (!submitData.preferences) {
            submitData.preferences = {};
          }
          submitData.clusterPermissions = clusterPermissions;
        }
        
        const ret = mode === 'create'
          ? await createUserSetting(submitData)
          : await updateUserSetting(submitData);
        await onOk(ret);
      }}
      onCancel={async () => {
        await onCancel();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        validateMessages={{
          required: i18nInstance.t(
            'e0a23c19b8a0044c5defd167b441d643',
            "'${name}' is required",
          ),
        }}
      >
        <Typography.Title level={5}>User Information</Typography.Title>
        
        {mode === 'create' && (
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>
        )}

        <Form.Item
          name="displayName"
          label="Display Name"
        >
          <Input placeholder="Enter display name" />
        </Form.Item>

        {mode === 'create' && (
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input a password' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
        )}

        <Form.Item
          name={['preferences', 'role']}
          label="Role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select
            options={globalRoleOptions}
            placeholder="Select user role"
            onChange={handleRoleChange}
          />
        </Form.Item>

        {showClusterPermissions && (
          <>
            <Divider />
            <Typography.Title level={5}>Cluster Permissions</Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              For Basic Users, select clusters they should have access to:
            </Typography.Text>
            
            <Transfer
              dataSource={clusterItems}
              titles={['Available Clusters', 'Granted Access']}
              targetKeys={targetKeys}
              onChange={handleTransferChange}
              render={item => (
                <Flex justify="space-between" align='center'>
                  <span>{item.title}</span>
                  <Select
                    options={clusterRoleOptions}
                    placeholder="Select cluster role"
                    mode="multiple"
                    style={{ width: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(value) => {
                      setClusterRoles({
                        ...clusterRoles,
                        [item.title]: value
                      });
                    }}
                    value={clusterRoles[item.title] || []}
                  />
                </Flex>
              )}
              listStyle={{ width: 350, height: 300 }}
            />
          </>
        )}
      </Form>
    </Modal>
  );
};

export default UserSettingsModal;
