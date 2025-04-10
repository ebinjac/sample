import { pgTable, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const certificates = pgTable('certificates', {
  certificateIdentifier: varchar('certificate_identifier', { length: 512 }).primaryKey(),
  id: varchar('id', { length: 64 }),
  commonName: varchar('common_name', { length: 512 }),
  certificateStatus: varchar('certificate_status', { length: 64 }),
  certificatePurpose: varchar('certificate_purpose', { length: 128 }),
  currentCert: boolean('current_cert'),
  environment: varchar('environment', { length: 64 }),
  serialNumber: varchar('serial_number', { length: 128 }),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  subjectAlternateNames: text('subject_alternate_names'),
  zeroTouch: boolean('zero_touch'),
  issuerCertAuthName: varchar('issuer_cert_auth_name', { length: 256 }),
  hostingTeamName: varchar('hosting_team_name', { length: 128 }),
  idaasIntegrationId: varchar('idaas_integration_id', { length: 64 }),
  isAmexCert: boolean('is_amex_cert'),
  certType: varchar('cert_type', { length: 64 }),
  acknowledgedBy: varchar('acknowledged_by', { length: 128 }),
  centralID: varchar('central_id', { length: 64 }),
  applicationName: varchar('application_name', { length: 128 }),
  comment: text('comment'),
  renewingTeamName: varchar('renewing_team_name', { length: 128 }),
  changeNumber: varchar('change_number', { length: 64 }),
  serverName: varchar('server_name', { length: 128 }),
  keystorePath: text('keystore_path'),
  uri: text('uri'),
  revokeRequestId: varchar('revoke_request_id', { length: 64 }),
  revokeDate: text('revoke_date'),
  requestId: varchar('request_id', { length: 64 }),
  requestedByUser: varchar('requested_by_user', { length: 256 }),
  requestedForUser: varchar('requested_for_user', { length: 256 }),
  approvedByUser: varchar('approved_by_user', { length: 256 }),
  requestChannelName: varchar('request_channel_name', { length: 128 }),
  certNotifications: jsonb('cert_notifications'),
  devices: jsonb('devices').default(sql`'[]'::jsonb`),
  agentVaultCerts: jsonb('agent_vault_certs'),
  taClientName: varchar('ta_client_name', { length: 64 }),
  applicationId: varchar('application_id', { length: 64 }),
  // Tracking fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 256 }),
  renewedBy: varchar('renewed_by', { length: 256 }),
});


// src/db/schema.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, uniqueIndex, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Team Table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamName: varchar('team_name', { length: 128 }).notNull().unique(),
  escalation: varchar('escalation', { length: 256 }),
  alert1: varchar('alert1', { length: 256 }),
  alert2: varchar('alert2', { length: 256 }),
  alert3: varchar('alert3', { length: 256 }),
  snowGroup: varchar('snow_group', { length: 128 }),
  prcGroup: varchar('prc_group', { length: 128 }),
  applications: jsonb('applications').default([]),
});

// Certificate Table
export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  certificateIdentifier: varchar('certificate_identifier', { length: 512 }).notNull(),
  renewingTeamId: uuid('renewing_team_id').references(() => teams.id),
  commonName: varchar('common_name', { length: 512 }),
  certificateStatus: varchar('certificate_status', { length: 64 }),
  certificatePurpose: varchar('certificate_purpose', { length: 128 }),
  currentCert: boolean('current_cert'),
  environment: varchar('environment', { length: 64 }),
  serialNumber: varchar('serial_number', { length: 128 }),
  validFrom: text('valid_from'),
  validTo: text('valid_to'),
  subjectAlternateNames: text('subject_alternate_names'),
  zeroTouch: boolean('zero_touch'),
  issuerCertAuthName: varchar('issuer_cert_auth_name', { length: 256 }),
  hostingTeamName: varchar('hosting_team_name', { length: 128 }),
  idaasIntegrationId: varchar('idaas_integration_id', { length: 64 }),
  isAmexCert: boolean('is_amex_cert'),
  certType: varchar('cert_type', { length: 64 }),
  acknowledgedBy: varchar('acknowledged_by', { length: 128 }),
  centralID: varchar('central_id', { length: 64 }),
  applicationName: varchar('application_name', { length: 128 }),
  comment: text('comment'),
  changeNumber: varchar('change_number', { length: 64 }),
  serverName: varchar('server_name', { length: 128 }),
  keystorePath: text('keystore_path'),
  uri: text('uri'),
  revokeRequestId: varchar('revoke_request_id', { length: 64 }),
  revokeDate: text('revoke_date'),
  requestId: varchar('request_id', { length: 64 }),
  requestedByUser: varchar('requested_by_user', { length: 256 }),
  requestedForUser: varchar('requested_for_user', { length: 256 }),
  approvedByUser: varchar('approved_by_user', { length: 256 }),
  requestChannelName: varchar('request_channel_name', { length: 128 }),
  certNotifications: jsonb('cert_notifications'),
  devices: jsonb('devices').default(sql`'[]'::jsonb`),
  agentVaultCerts: jsonb('agent_vault_certs'),
  taClientName: varchar('ta_client_name', { length: 64 }),
  applicationId: varchar('application_id', { length: 64 }),
  // Tracking fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 256 }),
  renewedBy: varchar('renewed_by', { length: 256 }),
}, (table) => ({
  uniqueCertTeam: uniqueIndex('unique_cert_team').on(table.certificateIdentifier, table.renewingTeamId),
}));

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
  certificates: many(certificates),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  renewingTeam: one(teams, {
    fields: [certificates.renewingTeamId],
    references: [teams.id],
  }),
}));

// Zod Schemas for validation
export const insertTeamSchema = createInsertSchema(teams);
export const selectTeamSchema = createSelectSchema(teams);

export const insertCertificateSchema = createInsertSchema(certificates, {
  certificateIdentifier: z.string().min(1),
  renewingTeamId: z.string().uuid(),
}).refine(async (data) => {
  // Custom validation for unique cert per team
  const existing = await db.query.certificates.findFirst({
    where: (cert, { and, eq }) => and(
      eq(cert.certificateIdentifier, data.certificateIdentifier),
      eq(cert.renewingTeamId, data.renewingTeamId)
    ),
  });
  return !existing;
}, {
  message: "Certificate already exists for this team",
  path: ["certificateIdentifier"],
});

export const updateCertificateSchema = insertCertificateSchema.partial();