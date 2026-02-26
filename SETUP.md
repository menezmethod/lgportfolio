# Setup Guide

## 1) Install and run

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio
npm install
cp .env.example .env.local
npm run dev
```

## 2) Configure chat backend

Set these in `.env.local`:

```env
INFERENCIA_BASE_URL=http://localhost:8080/v1
INFERENCIA_API_KEY=replace-with-your-key
INFERENCIA_CHAT_MODEL=mlx-community/gpt-oss-20b-MXFP4-Q8
```

This site assumes production chat is powered by gpt-oss on a local MacBook Pro M4 Max through an OpenAI-compatible endpoint.

## 3) Run local checks

```bash
npm run lint
npm run build
```

## 4) Run chat behavior evaluation from CLI

Start dev server, then:

```bash
./scripts/run-chat-eval.sh --base-url http://localhost:3000
```

If testing remote environments, protect eval with token:

```env
CHAT_EVAL_TOKEN=replace-with-random-secret
```

Then:

```bash
./scripts/run-chat-eval.sh --base-url https://gimenez.dev --token "$CHAT_EVAL_TOKEN"
```

## 5) Deployment

Pushes to `main` trigger Cloud Build deployment to Cloud Run.

For infrastructure changes:

```bash
cd terraform
terraform fmt -check
terraform init
terraform validate
terraform plan
terraform apply
```

## 6) Post-deploy smoke checks

```bash
curl -s https://gimenez.dev/api/health
curl -s https://gimenez.dev/api/war-room/data
```
