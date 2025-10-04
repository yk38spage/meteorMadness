import uvicorn
from asteroid_backend import app

if __name__ == "__main__":
    uvicorn.run("asteroid_backend:app",host="0.0.0.0",port=8000,reload=True)