-- Seed Clause Library with high-fidelity standard clauses for common compliance frameworks

INSERT INTO clause_library (clause_name, clause_category, standard_language, jurisdiction, applicable_standards, risk_level_if_missing)
VALUES 
('KDPA Breach Notification', 'Data Breach', 'The Processor shall notify the Controller of any personal data breach within 48 hours of becoming aware of such breach, in accordance with Section 43 of the Kenya Data Protection Act 2019.', 'Kenya', '["KDPA"]', 'high'),

('GDPR DPA - Standard Clauses', 'Data Processing', 'The Processor shall only process personal data on documented instructions from the Controller, including with regard to transfers of personal data to a third country or an international organization, unless required to do so by Union or Member State law.', 'European Union', '["GDPR"]', 'critical'),

('CBK Outsourcing Audit Rights', 'Audit & Compliance', 'The Institution and the Central Bank of Kenya shall have the right to conduct audits or inspections of the Service Provider''s operations, systems, and controls related to the outsourced services at any time.', 'Kenya', '["CBK"]', 'high'),

('Data Sovereignty - MEA', 'Data Residency', 'All personal data relating to Kenyan data subjects shall be stored on servers located within the jurisdiction of the Republic of Kenya, unless a specific exemption is granted under the Data Protection (General) Regulations 2021.', 'Kenya', '["KDPA"]', 'critical'),

('Right to Erasure (GDPR)', 'Data Subject Rights', 'The Processor shall, at the choice of the Controller, delete or return all the personal data to the Controller after the end of the provision of services relating to processing, and delete existing copies unless Union or Member State law requires storage of the personal data.', 'European Union', '["GDPR"]', 'medium');
