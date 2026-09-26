import os
import sys
import json
import requests
from dotenv import load_dotenv
from django.conf import settings
from django.core.management import execute_from_command_line
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.urls import path

# Carrega as variáveis do arquivo .env
load_dotenv()

# CONFIGURAÇÕES OBTIDAS COM SEGURANÇA VIA .ENV
TOKEN_MELHOR_ENVIO = os.getenv("TOKEN_MELHOR_ENVIO")
CEP_ORIGEM_LOJA = os.getenv("CEP_ORIGEM_LOJA")
SECRET_KEY = os.getenv("SECRET_KEY", "chave-secreta-fallback-desenvolvimento")

# 1. CONFIGURAÇÃO AUTOMÁTICA DO DJANGO E DO BANCO DE DADOS (SQLite)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY=SECRET_KEY,
        ROOT_URLCONF=__name__,
        ALLOWED_HOSTS=['*'],
        INSTALLED_APPS=[
            'django.contrib.contenttypes',
            'django.contrib.auth',
        ],
        # Cria o banco de dados automaticamente como um arquivo local 'banco_teste.sqlite3'
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': os.path.join(BASE_DIR, 'banco_teste.sqlite3'),
            }
        },
        MIDDLEWARE=[
            'django.middleware.common.CommonMiddleware',
        ],
    )

# 2. FUNÇÃO DA API DE CÁLCULO DE FRETE
@csrf_exempt
def calcular_frete_view(request):
    if request.method == 'POST':
        try:
            dados_recebidos = json.loads(request.body)
            cep_destino = dados_recebidos.get('cep_destino')

            if not cep_destino or len(cep_destino) != 8:
                return JsonResponse({"erro": "CEP de destino inválido."}, status=400)

            # Endpoint oficial do Melhor Envio para Produção
            url = "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate"
            
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": f"Bearer {TOKEN_MELHOR_ENVIO}",
                "User-Agent": "Aplicacao Teste Django (seu-email@teste.com)"
            }

            # Dados do pacote simulando 1 camiseta (250g)
            body = {
                "from": {"postal_code": CEP_ORIGEM_LOJA},
                "to": {"postal_code": cep_destino},
                "package": {
                    "height": 4,       # 4 cm
                    "width": 12,      # 12 cm
                    "length": 15,     # 15 cm
                    "weight": 0.25    # 250 gramas
                }
            }

            response = requests.post(url, json=body, headers=headers)
            
            # Criamos uma resposta HTTP padrão permitindo que o HTML local acesse a API (CORS)
            django_response = JsonResponse(response.json(), safe=False, status=response.status_code)
            django_response["Access-Control-Allow-Origin"] = "*"
            django_response["Access-Control-Allow-Headers"] = "Content-Type"
            return django_response

        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=500)
            
    elif request.method == 'OPTIONS':
        # Trata a requisição preliminar (Preflight) do navegador
        django_response = JsonResponse({}, status=200)
        django_response["Access-Control-Allow-Origin"] = "*"
        django_response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        django_response["Access-Control-Allow-Headers"] = "Content-Type"
        return django_response

# Rotas do Django
urlpatterns = [
    path('api/calcular-frete/', calcular_frete_view),
]

# 3. COMANDO PARA CRIAR O BANCO E RODAR O SERVIDOR AUTOMATICAMENTE
if __name__ == '__main__':
    # Força o Django a criar o arquivo de banco de dados e rodar as migrações iniciais
    import django
    django.setup()
    from django.core.management import call_command
    
    print("🤖 Configurando e criando o banco de dados SQLite automaticamente...")
    call_command('migrate', interactive=False)
    
    print("🚀 Banco pronto! Iniciando o servidor na porta 8000...")
    sys.argv = [sys.argv[0], 'runserver', '127.0.0.1:8000']
    execute_from_command_line(sys.argv)