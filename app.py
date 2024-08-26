from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

import time
import requests
import os
import transformers
import torch
from google.colab import userdata
from datasets import load_dataset
from trl import SFTTrainer
from peft import LoraConfig
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import BitsAndBytesConfig, GemmaTokenizer

app = Flask(__name__)
CORS(app)

load_dotenv()

HF_TOKEN = os.getenv('HF_TOKEN')
model_id = "google/gemma-2b-it"
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)

tokenizer = AutoTokenizer.from_pretrained(model_id, token=os.environ['HF_TOKEN'])
model = AutoModelForCausalLM.from_pretrained(model_id,
                                             quantization_config=bnb_config,
                                             device_map={"":0},
                                             token=os.environ['HF_TOKEN'])

GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
lora_config = LoraConfig(
    r = 8,
    target_modules = ["q_proj", "o_proj", "k_proj", "v_proj",
                      "gate_proj", "up_proj", "down_proj"],
    task_type = "CAUSAL_LM",
)
from datasets import load_dataset


ds2 = load_dataset("Amod/mental_health_counseling_conversations")
ds2=ds2.map(lambda samples: tokenizer(samples["Context"]),batched=True)

def formatting_func(example):
      text = f"Instruction: {example['Context'][0]}\nResponse: {example['Response'][0]}"
      return [text]
trainer = SFTTrainer(
    model=model,
    train_dataset=ds2["train"],
    args=transformers.TrainingArguments(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        warmup_steps=2,
        max_steps=300,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=1,
        output_dir="outputs",
        optim="paged_adamw_8bit"
    ),
    peft_config=lora_config,
    formatting_func=formatting_func,
)
trainer.train()

@app.route('/start', methods=['GET'])
def start():
    return jsonify({'response': 'Hello World!'})


@app.route('/chat', methods=['POST'])   
def chat():
    data = request.get_json()
    message = (data['message'] or "no message")
    previous= data['previous']
    print("message: ", message)
    print("previous: ", previous)
    
    history=""
    for i in range(len(previous)):
        user=previous[i]['user']
        if(user=="Therapist"):
            user="model"
        else:
            user="user"
        history= history + " role: "+ user+ " parts: "+ previous[i]['text'] + " \n"

    print("history: ", history)
    
    
    
    

    
    
    

    
    
    msg= "Instruction: I am calling this from backend just give answer as string. You are a therapist. Let's behave you are taking my session. My response is : "+ message + ". and history of the therapy session till now is: "+history+" Now give a proper response to this. Answer in english only \n Response:"
    device = "cuda:0"
    inputs = tokenizer(msg, return_tensors="pt").to(device)
    outputs = model.generate(**inputs, max_new_tokens=100)
    print(tokenizer.decode(outputs[0]))
    response = tokenizer.decode(outputs[0])
    answer=response.split("Response:")[1]

    
    

    return jsonify({'response': answer})



if __name__ == '__main__':
    app.run(debug=True)