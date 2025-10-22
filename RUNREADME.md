# Guia Completo de Execução — SEM5-PI-WEBAPI

Este documento explica **como correr o projeto SEM5-PI-WEBAPI** tanto **em ambiente local** como **na VM do ISEP**, incluindo:

* Como **publicar e enviar o projeto para a VM**
* Como **configurar e reiniciar a base de dados**
* Como **executar o seeding (Bootstrap)**
* E como **verificar o estado do servidor e da base de dados**

---

## Ligar à VM (Servidor Remoto)

Para aceder à máquina virtual (VM) onde a API será hospedada, utiliza o protocolo SSH.

```bash
ssh root@vs343.dei.isep.ipp.pt
```

Quando solicitado, introduz a palavra-passe:

```
3dj03
```

Se a ligação for bem-sucedida, o terminal mostrará:

```
Linux vs343 5.4.0-216-generic ...
root@vs343:~#
```

---

## Publicar o projeto na VM

Caso a VM **ainda não tenha o projeto instalado**, é necessário **publicar e enviar os binários**.
Isto é feito automaticamente pelo script que criámos:
`Script-Publish-Project.sh`.

---

### Passos no teu computador (máquina local)

Na raiz do projeto, executa:

```bash
bash Script-Publish-Project.sh
```

Este script faz automaticamente:

1. `dotnet publish -c Release -r linux-x64 --self-contained true`
2. Cria a pasta `/bin/Release/net9.0/linux-x64/publish/`
3. Copia todos os ficheiros para a VM no diretório `/var/www/sem5_api/`
   através de **SCP** (Secure Copy).

No fim, o projeto estará acessível na VM em:

```
/var/www/sem5_api/
```

---

## Reiniciar ou limpar a base de dados PostgreSQL

Caso seja necessário **reiniciar ou limpar completamente a base de dados** (por exemplo, em testes ou para resetar dados), usamos os scripts:

| Sistema Operativo  | Script                              |
| ------------------ | ----------------------------------- |
| Linux / macOS / VM | `DataBase-Script-Linux-Mac-VMdb.sh` |
| Windows            | `DataBase-Script-Windows-VMdb.ps1`  |


### Executar (Linux / macOS / VM)

```bash
bash DataBase-Script-Linux-Mac-VMdb.sh
```

### Executar (Windows PowerShell)

```powershell
.\DataBase-Script-Windows-VMdb.ps1
```

O script remove todas as tabelas, vistas e sequências do schema `public` da base de dados `ThPA` e recria o estado inicial — sem precisar de acesso de superuser.

---

## Verificar o estado da base de dados

Podes verificar o conteúdo da base de dados de **duas formas**:

### A) Usando a aplicação **pgAdmin 4**

1. Abre o pgAdmin 4.
2. Adiciona um novo servidor com:

    * **Host:** `10.9.21.87`
    * **Port:** `5432`
    * **Database:** `ThPA`
    * **Username:** `makeitsimple_user`
    * **Password:** `3dj03`
3. Assim podes navegar pelas tabelas e verificar se o seed foi aplicado corretamente.

---

### B) Usando o Rider (Database Tool)

1. Abre o Rider → separador **Database**.
2. Clica em ➕ → **Data Source → PostgreSQL**.
3. Em “URL”, coloca:

   ```
   jdbc:postgresql://10.9.21.87:5432/ThPA?connectTimeout=15&password=3dj03&user=makeitsimple_user
   ```
4. Clica em **Test Connection** → deve aparecer *Connection successful* 

Assim podes consultar as tabelas e executar queries diretamente no IDE.

---

## Executar o **Bootstrap (Seed)**

O **Bootstrap** carrega dados iniciais (vessels, docks, staff, etc.) a partir dos ficheiros JSON na pasta `/Seed`.

---

### Na VM:

```bash
cd /var/www/sem5_api
ASPNETCORE_ENVIRONMENT=Development ./SEM5-PI-WEBAPI --seed
```

Isto:

* Define o ambiente como *Development* (para permitir o seed);
* Lê os ficheiros JSON;
* Cria as entidades na base de dados;
* E termina automaticamente após completar o seeding.

 **Nota:** Se o ambiente estiver em `Production`, o seed é **ignorado automaticamente** por segurança.

---

## Iniciar o servidor manualmente (modo produção)

Para correr a API de forma normal (sem seed):

```bash
cd /var/www/sem5_api
ASPNETCORE_URLS=http://0.0.0.0:5008 ASPNETCORE_ENVIRONMENT=Production ./SEM5-PI-WEBAPI
```

A API ficará acessível em:

```
http://10.9.21.87:5008
```

---

### Verificar se o servidor está a correr

```bash
sudo ss -tuln | grep 5008
```

Se aparecer algo como:

```
LISTEN 0 100 *:5008 *:*
```

significa que o Kestrel está ativo e a escutar na porta 5008.

---

### Rodar o servidor em background

```bash
nohup ASPNETCORE_URLS=http://0.0.0.0:5008 ASPNETCORE_ENVIRONMENT=Production ./SEM5-PI-WEBAPI > app.log 2>&1 &
```

Verifica se o processo está ativo:

```bash
ps aux | grep SEM5-PI-WEBAPI
```

---

## Consultar os logs da aplicação

Os logs da API estão em:

```
/var/www/sem5_api/Logs/
```

| Tipo de Log                 | Localização                               |
| --------------------------- | ----------------------------------------- |
| Geral da aplicação          | `Logs/GeneralLogs/`                       |
| Bootstrap (seeding)         | `Logs/Bootstrap/`                         |
| Vessels, StorageAreas, etc. | `Logs/Vessels/`, `Logs/StorageArea/`, ... |

### Ver logs gerais em tempo real:

```bash
tail -f Logs/GeneralLogs/general-$(date +%Y%m%d).log
```

### Ver logs do seeding:

```bash
tail -f Logs/Bootstrap/bootstrap-$(date +%Y%m%d).log
```

---

## Executar localmente (modo desenvolvimento)

### Sem seeding

```bash
dotnet run
```

### Com seeding

```bash
dotnet run --seed
```

O ambiente `Development` já está configurado no `launchSettings.json`:

```json
"applicationUrl": "https://localhost:7275;http://localhost:5008",
"environmentVariables": {
  "ASPNETCORE_ENVIRONMENT": "Development"
}
```

A API estará disponível em:

```
http://localhost:5008
https://localhost:7275
```

---

## Testar a API

Usa **Rider**, **Postman** ou **Insomnia** para fazer pedidos.

Exemplo:

```bash
GET http://10.9.21.87:5008/api/VesselType
Accept: application/json
```

Resposta esperada:

```json
[
  {
    "name": "Panamax",
    "description": "Medium-sized vessel capable of passing through the original Panama Canal locks",
    ...
  }
]
```

---

##  Correr os testes unitários

Executa no terminal:

```bash
dotnet test
```

.NET compila e executa todos os testes `xUnit`, mostrando:

```
Passed!  52 tests run in 4.31s
```

---

## Resumo final de comandos

| Ação                          | Comando                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Ligar à VM                    | `ssh root@vs343.dei.isep.ipp.pt`                                                         |
| Publicar projeto              | `bash Script-Publish-Project.sh`                                                         |
| Reiniciar DB (Linux/macOS/VM) | `bash DataBase-Script-Linux-Mac-VMdb.sh`                                                 |
| Reiniciar DB (Windows)        | `.\DataBase-Script-Windows-VMdb.ps1`                                                     |
| Executar seed                 | `ASPNETCORE_ENVIRONMENT=Development ./SEM5-PI-WEBAPI --seed`                             |
| Correr API (produção)         | `ASPNETCORE_URLS=http://0.0.0.0:5008 ASPNETCORE_ENVIRONMENT=Production ./SEM5-PI-WEBAPI` |
| Ver logs gerais               | `tail -f Logs/GeneralLogs/general-*.log`                                                 |
| Ver logs do seed              | `tail -f Logs/Bootstrap/bootstrap-*.log`                                                 |
| Ver estado da DB              | `pgAdmin 4` ou `jdbc:postgresql://10.9.21.87:5432/ThPA?...`                              |
| Testar API                    | `GET http://10.9.21.87:5008/api/VesselType`                                              |
| Correr testes                 | `dotnet test`                                                                            |
