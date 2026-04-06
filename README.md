# 人生账本（试用版）

静态网页：`index.html`、`app.js`、`styles.css`、`manifest.json`、`icon.svg`、`sw.js`。

本仓库 **[Yin-s-Lab](https://github.com/YinZhi-Clare/Yin-s-Lab)** 的**默认分支**名为 **`Time-on-your-side-app`**（不是 `main`）。

## 只把本文件夹上传到 GitHub

在终端中**进入本目录**（不要包含外层的 `Yin's project`）：

```bash
cd "/Users/zhiyin/Yin's project/time-on-your-side-app"

git init
git branch -M Time-on-your-side-app
git add .
git commit -m "Initial commit: 人生账本试用版"
```

在 [GitHub 新建空仓库](https://github.com/new)（不要勾选自动添加 README），然后：

```bash
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin Time-on-your-side-app
```

（若使用 SSH，把 `origin` 换成 `git@github.com:你的用户名/你的仓库名.git`。）

## 开启 GitHub Pages（HTTPS）

1. 打开该仓库 → **Settings** → **Pages**。
2. **Build and deployment** → **Source**：**Deploy from a branch**。
3. **Branch** 选 **`Time-on-your-side-app`**，文件夹选 **`/ (root)`**，保存。
4. 等待一分钟左右，用 Safari 打开提示的地址（形如 `https://yinzhi-clare.github.io/Yin-s-Lab/`），再「添加到主屏幕」即可。

之后更新页面：在本目录改文件 → `git add` → `git commit` → `git push`（会推到默认分支）。

## 本机未安装 Git

可先安装 Xcode 命令行工具：`xcode-select --install`，或使用 GitHub 网页 **Add file → Upload files** 把本文件夹内所有文件拖到仓库根目录（需手动维护更新）。
