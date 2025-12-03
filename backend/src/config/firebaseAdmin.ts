import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import dotenv from 'dotenv';                                                                                                 
dotenv.config();  

function initializeFirebase() {
    if (!admin.apps || admin.apps.length === 0) {
        if (process.env.NODE_ENV === 'test') {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: 'demo-project',
                    clientEmail: 'foo@bar.com',
                    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCg1sXYMnaOEKTK\nMzKpCOOy5N+qb3mGdI+onDS1uTm1DGkxcWCAjlnP1tGvWnWERDqTgvdVypiB5Q6n\nEzcHo9jIkdxKoKedSX/h07fK7s6Nm3OGC3NsVlYiFEFC9kEcb7L4tvSYtXrMInKe\ntBDOlXr85OETWJzAGsaSncujnkH6hd9w438evdOsdAMhATDmhlefc0owdYtJ3Okv\nrcu0LPDWTTRGK7vDrFvWPIerYHdx31mFbzmeHs0amJ572IJ8q706iwr0M2EmPU/i\nRm4+GT+t/rOYKVaB5OxtJyrl8lmoOEHN3QFkLphaVEfslL3fp8T6pYDF1TqciDCm\nF4UXO3GnAgMBAAECggEAJr2Emv4Qq0hcAO4TCj7/ZWQWcZ13Jokl3yV81raeLTsn\njUazSVPAUzz5daSywKCUgVpey9XIJSVwgZKxww/Wk/z6FCmdJdgByvmtf95EdzxV\nt5hDfXlQNtYtH/1jkn9fGuQqhyvTP58ef5Z8o93CaW6RvhCudOEeKkuCtM7WMoqx\ngTvMxDceeH7rswCnkpCdGWpu8KXMYwgHfc76zyi1Qxay2dpE60rwvxsljK6x3w6Q\n7vr+onKtC2PcpTETSw16Mg30qIheAz0zLbVExKGijYWBsJzjcdHqfxeV8DRe7RZx\nDqyPp2pGxfSHf9W9n80LF5xnUov78nD2x420mgcL/QKBgQDTZm1L4FmZxGgXHObF\nfPWjClPK1omptMHJ8PRoJi+1QlLPqNINSdNt8C0XzKmkI/NdcKTwbA7NfmeEmN6j\nO5BGA/e+t4otrzLkO/hk2Jrtd3CelTSvruuRF9LWbf+nZBtLBjbpd46gnJMy8xcy\n4TuJRfUvQqbIaXMl44TO5YYK5QKBgQDCxZLEY6tJs0jz+M9lh62PxtAK5pqGpWO8\nMyU5hFCyahjmIlsByKh+zwJMYYUV8h21Gt1hS6otdKe/RV0Q7y49zZLCWTxRCzlQ\nguMI2tP4blNjSHAbFViYtT74m8BGN9zvbneiIzrjv9+xawZOGMX7bPN5zi6Xlwoo\nFLLFYMTlmwKBgQDL+/veyV7sFy7xjnvHeGp1plNwWE+Bp9+OgqjzjlVeq97Ibfgx\nxljzrlt0qZHPxrjgIv+k1j/6Xcx5kCDUlXcDeHSoXOZCatnKjWuDs9ba6POMsiCi\nnUDFQp25N28HEHudiyOVaD4CENOgyBxMhjUyooSR09inbckkeEQAeE09WQKBgGle\nt8L1ZNJPYvVSMulrmHMDDMQI86pKSYWkacwPEBUlnujJx1BUvQs1dLnbvEMeJAI5\nUXD0nVFQHfw1S18A9pRK5c2stxvlJZGv7aF5uVlaXlSE+Nk+GBstWq7mnAOg7y69\nJY2a354czKjQDK4tatZVn/bSm5Q5Cy6Z3Ak6C+tnAoGBAMkIADF0Vfd96RtYFG3h\nSdkp6q/l5FzY/Fo+tQE2UbD6X7u/cN4oDKbgtC4s+Y0Zt9GFodaQucqFtv2yg6YH\ny8Nwr5GejW4rTAxtaeCdiALnCP4XxMdlUFCQ3ahozpUfHwP94WA9Tf4M4hXaL9Ou\noOZnHNg41ftebhNFcRSBg+JS\n-----END PRIVATE KEY-----'
                }),
                projectId: 'demo-project',
                storageBucket: 'demo-project.appspot.com',
            });
        } else {
            admin.initializeApp({
                credential: applicationDefault(),
                storageBucket: `${process.env.GCLOUD_PROJECT}.appspot.com`
            });
        }
    }
}

initializeFirebase();

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
