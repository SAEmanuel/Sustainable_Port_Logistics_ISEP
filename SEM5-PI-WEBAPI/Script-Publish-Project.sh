#!/bin/bash
set -e 

PROJECT_NAME="SEM5_PI_WEBAPI"
VM_USER="root"
VM_HOST="10.9.21.87"
VM_PATH="/var/www/sem5_api"
RUNTIME="linux-x64"

echo "🚀 Publicar projeto .NET ($PROJECT_NAME)..."
dotnet publish -c Release -r $RUNTIME --self-contained true -o ./publish

echo "📦 Publicação concluída! A preparar transferência..."
echo "   -> Diretório local: ./publish"
echo "   -> Destino remoto: $VM_USER@$VM_HOST:$VM_PATH"

# Copiar ficheiros para a VM via SCP
scp -r ./publish/* $VM_USER@$VM_HOST:$VM_PATH/

#reiniciar servidor remoto
echo "🔁 Reiniciar servidor remoto..."
ssh $VM_USER@$VM_HOST "pkill -f $PROJECT_NAME.dll || true; cd $VM_PATH && nohup ./SEM5_PI_WEBAPI > /dev/null 2>&1 &"

echo "✅ Deploy concluído com sucesso!"
echo "🌍 Servidor disponível em: http://$VM_HOST:5008/api/"
