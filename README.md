# @vizoai/cli

VizoAI CLI is a command-line interface for VizoAI.

## Installation

```bash
npm install @vizoai/cli -D
```

支持 Vercel 部署 NestJS 项目, 基于 [ncc](https://github.com/vercel/ncc) 打包

```bash
vizoai build --vercel
```

## 使用

在项目根目录下创建 `vercel.json` 文件

```json
{
  "buildCommand": "vizoai build --vercel"
}
```
