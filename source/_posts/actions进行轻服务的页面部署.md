---
title: 使用github actions进行轻服务的页面部署
date: 2021-10-22 10:22:14
tags: deploy qingfuwu
---

# 使用 github actions 进行[轻服务](https://qingfuwu.cn/)的页面托管

### 首先，轻服务官方文档给出了手动部署页面的教程[页面托管](https://qingfuwu.cn/docs/openapi/sdk/hosting.html#%E8%8E%B7%E5%8F%96%E9%A1%B5%E9%9D%A2%E6%89%98%E7%AE%A1%E4%BF%A1%E6%81%AF)。而我这里就简单地介绍一下使用 github actions 的自动部署。只要会一点 github actions,实现起来也比较简单。

[看看效果](https://qcjtoy.web.cloudendpoint.cn/)

### 1.github 创建仓库，配置.github/workflow/\*.yml,同时设置 secrets 变量 ACCESS_TOKEN 与 SERVICE_ID.

- #### 配置 workflow 的 yml 文件。
  直接复制里面的 Usage,[Deploy to ByteInspire Hosting](https://github.com/marketplace/actions/deploy-to-byteinspire-hosting)

```yaml
name: Deploy Hosting

on: push

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      # Add any build steps here. For example:
      # - run: npm ci && npm run build
      - uses: byteinspire/hosting-deployer-action@v1
        with:
          service-id: "${{ secrets.SERVICE_ID }}"
          token: "${{ secrets.ACCESS_TOKEN }}"
          # Or you can use file param to directly specify the ziped file path
          directory: ./
```

<!-- more -->

- #### 配置 secrets 的变量 ACCESS_TOKEN 与 SERVICE_ID

1. ACCESS_TOKEN
   官方已经写得很详细了[创建和管理访问凭证](https://qingfuwu.cn/docs/openapi/personaltoken.html#%E5%88%9B%E5%BB%BA%E4%B8%AA%E4%BA%BA%E8%AE%BF%E9%97%AE%E5%87%AD%E8%AF%81)
   ![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110221004.png)
   ![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110221006.png)
2. SERVICE_ID
   登录轻服务后[https://qingfuwu.cn/dashboard](https://qingfuwu.cn/dashboard)，在首页就能看见你创建的所有服务。
   ![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110220950.png)
   这里就选择 hello world 这个服务，点击进去，再进入到设置里面就可以看见 SERVICE_ID.当然这里你也可以直接点击页面托管，上传压缩文件手动部署。![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110220952.png)
3. 添加变量到 secrets 里面，这里我已经添加上了。这里要注意的是设置 respository secret，因为最开始设置成 environment secret 而失败几次 😭
   ![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110220955.png)

### 2. 经过上面的步骤，大致就可以完成了。

#####看看 actions 吧，忽略前几次 environment secret 的锅 😂
![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110221013.png)
进入页面托管，点击网站域名，就可以看见部署后的页面了。
![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110221016.png)
最终效果：
![](https://gitee.com/gitme-H/images-bed/raw/master/img/202110221025.png)
