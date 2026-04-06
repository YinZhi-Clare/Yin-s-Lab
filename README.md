# 人生账本（试用版）

静态网页：`index.html`、`app.js`、`styles.css`、`manifest.json`、`icon.svg`、`sw.js`。

- **GitHub 仓库**：[YinZhi-Clare/Yin-s-Lab](https://github.com/YinZhi-Clare/Yin-s-Lab)  
- **默认分支**：`Time-on-your-side-app`（不是 `main`）  
- **线上地址（GitHub Pages）**：<https://yinzhi-clare.github.io/Yin-s-Lab/>

以下命令需本机已安装 **Git**（终端里 `git --version` 能输出版本号即可）。

---

## 日常更新并推送到 GitHub

在终端进入本目录后：

```bash
cd "/Users/zhiyin/Yin's project/time-on-your-side-app"

git add .
git commit -m "说明本次修改"
git push origin Time-on-your-side-app
```

若提示没有设置 `upstream`，可执行一次：

```bash
git push -u origin Time-on-your-side-app
```

之后可直接 `git push`。

---

## 远程地址（HTTPS / SSH）

本仓库对应的远程一般为：

```text
https://github.com/YinZhi-Clare/Yin-s-Lab.git
```

SSH 示例：

```text
git@github.com:YinZhi-Clare/Yin-s-Lab.git
```

查看或修改：

```bash
git remote -v
git remote set-url origin https://github.com/YinZhi-Clare/Yin-s-Lab.git
```

---

## 从零在本机初始化并关联该仓库（仅供参考）

若目录里还没有 Git 仓库：

```bash
cd "/Users/zhiyin/Yin's project/time-on-your-side-app"

git init
git branch -M Time-on-your-side-app
git remote add origin https://github.com/YinZhi-Clare/Yin-s-Lab.git
git add .
git commit -m "Initial commit: 人生账本试用版"
git push -u origin Time-on-your-side-app
```

若已存在 `origin`，不要用 `remote add`，改用上面的 `git remote set-url`。

---

## 开启 GitHub Pages（HTTPS）

1. 打开仓库 **Settings** → **Pages**：<https://github.com/YinZhi-Clare/Yin-s-Lab/settings/pages>  
2. **Source**：**Deploy from a branch**。  
3. **Branch** 选 **`Time-on-your-side-app`**，文件夹 **`/ (root)`**，保存。  
4. 约 1～2 分钟后访问：<https://yinzhi-clare.github.io/Yin-s-Lab/>（以 Pages 页面显示的链接为准）。  
5. iPhone 请用 **Safari** 打开该 **https** 地址，再 **添加到主屏幕**。

---

## 没有 Git 时

可在 GitHub 网页用 **Add file → Upload files** 上传文件；日常更推荐本机安装 Git 后使用上面的 `commit` / `push`。
