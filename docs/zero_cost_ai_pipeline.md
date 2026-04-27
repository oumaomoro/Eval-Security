# 🚀 Zero-Investment KDPA/CBK Fine-Tuning Pipeline

This guide explains how to fine-tune a Llama-3-8B model for cybersecurity contract compliance (KDPA/CBK) using only free-tier infrastructure.

## 🛠️ Components
1. **Google Colab (Free Tier)**: For GPU-accelerated QLoRA training (T4 GPU).
2. **Hugging Face (Free Tier)**: For model hosting and serverless inference.
3. **DeepSeek (Optional/Free Credits)**: For synthetic data generation.

## 📋 Step-by-Step Workflow

### 1. Data Preparation
- Use the template in `data/kdpa_finetune_template.jsonl`.
- Add at least 50–100 examples of `{ "instruction", "input", "output" }`.
- Upload this file to your Google Drive under `Costloci/kdpa_finetune.jsonl`.

### 2. Fine-Tuning (Google Colab)
- Open `notebooks/finetune_kdpa.ipynb` in [Google Colab](https://colab.research.google.com/).
- Mount your Google Drive.
- Run the cells to install dependencies, load the quantized model, and train.
- The training will save **LoRA Adapters** to your Drive.

### 3. Merging & Uploading
- Download the adapters to your local machine or run this on a machine with enough RAM (16GB+).
- Use `scripts/upload_to_hf.py` to merge the adapters with the base Llama-3 model.
- Set your `HF_TOKEN` and `REPO_ID` in the script.
- Run: `python scripts/upload_to_hf.py`.

### 4. Integration
- Update your `.env` file with:
  ```env
  HF_TOKEN=your_huggingface_token
  HF_MODEL_ID=your-username/costloci-kdpa-llama3
  ```
- The `AIGateway.ts` is already configured to prioritize this model.

### 5. Validation
- Run the test script:
  ```bash
  node scripts/test_hf_model.js
  ```

## ⚠️ Free Tier Limitations
- **Colab**: 12-hour session limit on T4 GPU. Save checkpoints to Drive frequently.
- **Hugging Face**: Serverless inference is rate-limited (approx. 30 requests/min). 
- **Model Size**: 8B models are the sweet spot for Colab Free Tier.

## 🚀 Future Scalability
- For higher volumes, migrate the model to a **Hugging Face Dedicated Endpoint** or a private GPU cluster.
- Continue fine-tuning on real (anonymized) contract data as the platform scales.
