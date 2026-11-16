import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');
const project = gcpConfig.require('project');
const region = gcpConfig.require('region');
const stack = pulumi.getStack();

const imageTag = config.get('imageTag');

const name = (suffix: string) => `planner-${suffix}-${stack}`;

const registry = new gcp.artifactregistry.Repository('registry', {
  repositoryId: 'planner-web',
  location: region,
  format: 'DOCKER',
  description: 'planner-web images',
  cleanupPolicies: [
    { id: 'keep-recent', action: 'KEEP', mostRecentVersions: { keepCount: 20 } },
    { id: 'delete-old', action: 'DELETE', condition: { olderThan: `${30 * 24 * 3600}s` } },
  ],
});

const imageBase = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${registry.repositoryId}/web`;
const image = imageTag
  ? pulumi.interpolate`${imageBase}:${imageTag}`
  : pulumi.output('us-docker.pkg.dev/cloudrun/container/hello');

const runner = new gcp.serviceaccount.Account('web-runner', {
  accountId: name('web'),
  displayName: `planner-web site (${stack})`,
});

const service = new gcp.cloudrunv2.Service('web', {
  name: name('web'),
  location: region,
  ingress: 'INGRESS_TRAFFIC_ALL',
  deletionProtection: stack === 'prod',
  template: {
    serviceAccount: runner.email,
    scaling: { minInstanceCount: 0, maxInstanceCount: stack === 'prod' ? 5 : 2 },
    containers: [
      {
        image,
        ports: { containerPort: 8080 },
        resources: { limits: { cpu: '1', memory: '256Mi' }, cpuIdle: true },
        startupProbe: { httpGet: { path: '/' } },
      },
    ],
  },
});

new gcp.cloudrunv2.ServiceIamMember('web-public', {
  name: service.name,
  location: region,
  role: 'roles/run.invoker',
  member: 'allUsers',
});

export const webUrl = service.uri;
export const imageRepository = imageBase;
