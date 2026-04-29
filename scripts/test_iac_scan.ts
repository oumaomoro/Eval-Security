import axios from "axios";

async function testIaCScan() {
  console.log("🔍 Testing IaC Security Sentinel...");

  const terraformContent = `
    resource "aws_s3_bucket" "public_data" {
      bucket = "customer-sensitive-data"
      acl    = "public-read-write"
      
      tags = {
        Environment = "Prod"
      }
    }

    resource "aws_db_instance" "default" {
      allocated_storage    = 10
      db_name              = "mydb"
      engine               = "mysql"
      instance_class       = "db.t3.micro"
      username             = "admin"
      password             = "password123"
      skip_final_snapshot  = true
      publicly_accessible  = true
    }
  `;

  try {
    // Note: This requires the server to be running. 
    // In this context, I'll mock the service call if needed, 
    // but since I'm testing the logic, I'll run the scanner directly.
    
    const { IaCScanner } = await import("../server/services/IaCScanner.js");
    const findings = await IaCScanner.scanTerraform(terraformContent);

    console.log("✅ Scan Results Received:");
    console.table(findings);

    if (findings.length > 0) {
      console.log("🚀 Sentinel successfully identified risks.");
    } else {
      console.log("⚠️ No risks found (check LLM connectivity).");
    }

  } catch (err: any) {
    console.error("❌ Test failed:", err.message);
  }
}

testIaCScan();
