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



// src/app/actions/certificate-actions.ts
'use server';

import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { certificates, teams } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@clerk/nextjs';

// Create Certificate
export async function createCertificate(data: z.infer<typeof insertCertificateSchema>) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    const [cert] = await db.insert(certificates)
      .values({ ...data, createdBy: userId })
      .returning();

    revalidatePath('/certificates');
    return { success: true, data: cert };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update Certificate
export async function updateCertificate(id: string, data: z.infer<typeof updateCertificateSchema>) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    const [cert] = await db.update(certificates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(certificates.id, id))
      .returning();

    revalidatePath('/certificates');
    return { success: true, data: cert };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete Certificate
export async function deleteCertificate(id: string) {
  try {
    const { userId } = auth();
    if (!userId) throw new Error('Unauthorized');

    await db.delete(certificates)
      .where(eq(certificates.id, id));

    revalidatePath('/certificates');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get Certificates with Team Info
export async function getCertificates() {
  return db.query.certificates.findMany({
    with: { renewingTeam: true },
    orderBy: (cert, { desc }) => [desc(cert.createdAt)],
  });
}