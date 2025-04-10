'use server';

import { db } from '@/db';
import { certificates } from '@/db/schema';
import { eq, and, like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function searchCertificates(formData: FormData) {
  const rawFormData = {
    commonName: formData.get('commonName') as string,
    serialNumber: formData.get('serialNumber') as string,
    isAmexCert: formData.get('isAmexCert') === 'on',
  };

  // Validation
  if (!rawFormData.commonName && !rawFormData.serialNumber) {
    return { error: 'At least one search parameter is required' };
  }

  try {
    let results = [];
    
    if (rawFormData.isAmexCert) {
      // API Call
      const params = new URLSearchParams();
      if (rawFormData.commonName) params.append('commonName', rawFormData.commonName);
      if (rawFormData.serialNumber) params.append('serialNumber', rawFormData.serialNumber);

      const res = await fetch(`https://api.certaas.com/certs?${params}`);
      if (!res.ok) throw new Error('API request failed');
      
      const data = await res.json();
      const certs = Array.isArray(data) ? data : [data];

      // Upsert logic
      const user = await getCurrentUser();
      for (const cert of certs) {
        const certData = {
          ...cert,
          devices: JSON.stringify(cert.devices || []),
          createdAt: new Date(),
          createdBy: user?.email || 'unknown',
          updatedAt: new Date(),
        };

        await db
          .insert(certificates)
          .values(certData)
          .onConflictDoUpdate({
            target: certificates.certificateIdentifier,
            set: {
              ...certData,
              createdAt: undefined,
              createdBy: undefined,
            }
          });
      }
      results = certs;
    } else {
      // Local DB Search
      const conditions = [];
      if (rawFormData.commonName) {
        conditions.push(like(certificates.commonName, `%${rawFormData.commonName}%`));
      }
      if (rawFormData.serialNumber) {
        conditions.push(eq(certificates.serialNumber, rawFormData.serialNumber));
      }

      results = await db
        .select()
        .from(certificates)
        .where(conditions.length ? and(...conditions) : undefined);
    }

    revalidatePath('/certificates');
    return { results };
  } catch (error) {
    return { error: error.message };
  }
}