import os
from huggingface_hub import HfApi, ModelCard, create_repo
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

def upload_to_hf(base_model_id, adapter_path, repo_id, hf_token):
    print(f"Loading base model: {base_model_id}")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id,
        torch_dtype=torch.float16,
        device_map="auto",
    )
    
    print(f"Loading adapters from: {adapter_path}")
    model = PeftModel.from_pretrained(base_model, adapter_path)
    
    print("Merging adapters...")
    model = model.merge_and_unload()
    
    print(f"Creating repository: {repo_id}")
    try:
        create_repo(repo_id, token=hf_token, private=True)
    except Exception as e:
        print(f"Repo may already exist: {e}")
        
    print(f"Pushing to Hugging Face: {repo_id}")
    model.push_to_hub(repo_id, token=hf_token)
    
    tokenizer = AutoTokenizer.from_pretrained(base_model_id)
    tokenizer.push_to_hub(repo_id, token=hf_token)
    
    print("Upload complete! 🚀")

if __name__ == "__main__":
    # These would normally be passed as args or env vars
    BASE_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"
    ADAPTER_PATH = "./adapters"
    REPO_ID = "your-username/costloci-kdpa-llama3"
    HF_TOKEN = os.getenv("HF_TOKEN")
    
    if not HF_TOKEN:
        print("Please set the HF_TOKEN environment variable.")
    else:
        upload_to_hf(BASE_MODEL, ADAPTER_PATH, REPO_ID, HF_TOKEN)
