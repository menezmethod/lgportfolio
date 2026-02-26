/**
 * Budget kill switch: when GCP Billing sends a budget alert to Pub/Sub,
 * scale the portfolio Cloud Run service to 0 to stop request-driven cost.
 * Triggered automatically at 50%, 90%, 100% of the $10 budget.
 */

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const region = process.env.CLOUD_RUN_REGION || 'us-east1';
const serviceName = process.env.CLOUD_RUN_SERVICE || 'lgportfolio';

/**
 * Cloud Function entry point (Pub/Sub message from budget alert).
 * @param {import('@google-cloud/functions-framework').CloudEvent} cloudEvent
 */
export function scaleCloudRunToZero(cloudEvent) {
  const raw = cloudEvent.data?.message?.data ?? cloudEvent.data?.data;
  if (!raw) {
    console.warn('No message data');
    return;
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch (e) {
    console.warn('Failed to parse budget payload:', e.message);
    return;
  }
  const threshold = payload.alertThresholdExceeded ?? payload.forecastThresholdExceeded;
  console.log('Budget alert', {
    budgetDisplayName: payload.budgetDisplayName,
    costAmount: payload.costAmount,
    budgetAmount: payload.budgetAmount,
    alertThresholdExceeded: payload.alertThresholdExceeded,
    forecastThresholdExceeded: payload.forecastThresholdExceeded,
  });
  if (threshold == null) {
    console.log('No threshold exceeded in payload, skipping scale-down');
    return;
  }
  return setCloudRunMaxInstances(0);
}

async function setCloudRunMaxInstances(maxInstances) {
  if (!projectId) {
    console.error('GOOGLE_CLOUD_PROJECT not set');
    return;
  }
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const url = `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/services/${serviceName}?updateMask=template.scaling.maxInstanceCount`;
  const res = await client.request({
    method: 'PATCH',
    url,
    data: {
      template: {
        scaling: {
          maxInstanceCount: maxInstances,
        },
      },
    },
  });
  console.log('Cloud Run updated:', res.data?.name, 'maxInstanceCount:', maxInstances);
}
