import torch

print("CUDA Available:", torch.cuda.is_available())

print("GPU:", torch.cuda.get_device_name(0))

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

x = torch.tensor([1.0, 2.0]).to(device)
print(x.device)