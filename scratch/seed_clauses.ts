
import { adminClient } from '../server/services/supabase.js';

async function seedClauses() {
  console.log("Seeding High-Fidelity Cybersecurity Clause Library...");
  
  const clauses = [
    {
      clause_name: "KDPA Data Processing",
      clause_category: "data_protection",
      standard_language: "The Processor shall process Personal Data only on documented instructions from the Controller, including with regard to transfers of personal data to a third country or an international organization, unless required to do so by the Data Protection Act (Kenya) 2019 to which the processor is subject.",
      jurisdiction: "kenya",
      applicable_standards: ["KDPA", "GDPR"],
      risk_level_if_missing: "critical",
      is_mandatory: true
    },
    {
      clause_name: "Security Breach Notification",
      clause_category: "incident_response",
      standard_language: "In the event of a security breach involving Personal Data, the Vendor shall notify the Customer without undue delay and, where feasible, not later than 48 hours after having become aware of it.",
      jurisdiction: "international",
      applicable_standards: ["ISO27001", "NIST", "KDPA"],
      risk_level_if_missing: "critical",
      is_mandatory: true
    },
    {
      clause_name: "Cyber Liability Limitation",
      clause_category: "liability",
      standard_language: "The Vendor's aggregate liability for all claims arising out of a data breach or security failure shall be limited to 5x the annual contract value, provided that gross negligence remains un-capped.",
      jurisdiction: "international",
      applicable_standards: ["General Law"],
      risk_level_if_missing: "high",
      is_mandatory: false
    },
    {
      clause_name: "Uptime SLA (99.99%)",
      clause_category: "sla",
      standard_language: "The Service Provider guarantees an availability of 99.99% for the Cloud Security Platform during each calendar month. Failures below this threshold shall trigger service credits equivalent to 10% of monthly fees for every hour of downtime.",
      jurisdiction: "international",
      applicable_standards: ["SLA"],
      risk_level_if_missing: "medium",
      is_mandatory: false
    }
  ];

  for (const clause of clauses) {
    const { data, error } = await adminClient.from('clause_library').insert(clause).select();
    if (error) {
      console.error(`Failed to seed ${clause.clause_name}:`, error.message);
    } else {
      console.log(`Successfully seeded: ${clause.clause_name} (ID: ${data[0].id})`);
    }
  }
}

seedClauses();
