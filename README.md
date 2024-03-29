<h1>Wordflow <a href="https://poloclub.github.io/wordflow/"><picture>

  <source media="(prefers-color-scheme: dark)" srcset="https://i.imgur.com/PtyzO16.png">
  <img align="right" alt="Wordflow logo." src="public/android-chrome-192x192.png" width="30" height="30">
</picture></a></h1>

[![Github Actions Status](https://github.com/poloclub/wordflow/workflows/build/badge.svg)](https://github.com/poloclub/wordflow/actions/workflows/build.yml)
[![license](https://img.shields.io/badge/License-MIT-blue)](https://github.com/poloclub/wordflow/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/wordflow?color=yellow)](https://www.npmjs.com/package/wordflow)
[![arxiv badge](https://img.shields.io/badge/arXiv-2401.14447-red)](https://arxiv.org/abs/2401.14447)

Social and customizable AI writing assistant tool ✍️

<table>
  <tr>
    <td colspan="3"><a href="https://poloclub.github.io/wordflow"><img width="100%" src='https://i.imgur.com/QaWYWni.png'></a></td>
  </tr>
  <tr></tr>
  <tr align="center">
    <td><a href="https://poloclub.github.io/wordflow">🚀 Wordflow Demo</a></td>
    <td><a href="https://youtu.be/3dOcVuofGVo">📺 Demo Video</a></td>
    <!-- <td><a href="https://youtu.be/l1mr9z1TuAk">👨🏻‍🏫 Conference Talk</a></td> -->
    <td><a href="https://arxiv.org/abs/2401.14447">📖 Research Paper</a></td>
  </tr>
</table>

## What is Wordflow?

Wordflow is a social and customizable AI writing assistant tool! With Wordflow, you can easily write and run AI prompts with different large language models, including both external models (e.g., GPT 4 and Gemini Pro) and local models (e.g., Llama 2 and Phi 2). You can also discover and share your favorite prompts with the community.

<table>
  <tr>
    <td>✅</td>
    <td>Store and run your favorite AI prompts</td>
  </tr>
  <tr></tr>
  <tr>
    <td>✅</td>
    <td>Support different external LLMs (e.g., GPT 4 and Gemini Pro)</td>
  </tr>
  <tr></tr>
  <tr>
    <td>✅</td>
    <td>Support multiple on-device LLMs (e.g., Llama 2 and Phi 2)</td>
  </tr>
  <tr></tr>
  <tr>
    <td>✅</td>
    <td>Powerful customization (e.g., temperature, templates)</td>
  </tr>
  <tr></tr>
    <tr>
    <td>✅</td>
    <td>Discover and share community prompts</td>
  </tr>
  <tr></tr>
  <tr></tr>
</table>

## Features

<img width="100%" src='https://github.com/poloclub/wordflow/assets/15007159/be1ed7df-6a25-477e-aa43-b78d66f53c4d'>

### Demo Video

<details>
  <summary>Click to see the demo video!</summary>
  <video src="https://github.com/poloclub/wordflow/assets/15007159/276bb179-ec92-4e44-bb65-e796b94506c6"></video>
</details>

## Get Started

### Standalone Version

To use Wordflow, visit: <https://poloclub.github.io/wordflow/>.

If you use macOS, we highly recommend you [creating a Web App using Safari](https://support.apple.com/en-us/104996). Open [Wordflow](https://poloclub.github.io/wordflow/) in Safari, and then from the menu bar, choose `File` > `Add to Dock`.

Note that currently [Safari doesn't support WebGPU](https://caniuse.com/webgpu). If you want to use local LLMs, you can use Chrome to save Wordflow as a [Chrome app](https://support.google.com/chrome_webstore/answer/3060053?hl=en). In Chrome, at the top right, click `More` > `More Tools` > `Create shortcut`.

<img height="100px" src="https://i.imgur.com/hkGw5zx.png">

### Google Doc Add-on

If you use Google Doc, we also provide a Wordflow Add-on that you can install from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/wordflow/851135867974). The source code of the add-on is in [this repository](https://github.com/poloclub/wordflow-doc).

## Developing Wordflow

Clone or download this repository:

```bash
git clone git@github.com:poloclub/wordflow.git
```

Install the dependencies:

```bash
npm install
```

Then run Wordflow:

```
npm run dev
```

Navigate to localhost:3000. You should see Wordflow running in your browser :)

## Credits

Wordflow is created by <a href='https://zijie.wang/' target='_blank'>Jay Wang</a>, <a href='https://www.linkedin.com/in/achakrav6' target='_blank'>Aishwarya Chakravarthy</a>, <a href='https://davidmunechika.com/' target='_blank'>David Munechika</a>, and <a href='' target='_blank'>Polo Chau</a>.

## Citation

To learn more about Wordflow and social prompt engineering, check out our [research paper](https://arxiv.org/abs/2401.14447).

```bibtex
@article{wangWordflowSocialPrompt2024,
  title = {Wordflow: {{Social Prompt Engineering}} for {{Large Language Models}}},
  shorttitle = {Wordflow},
  author = {Wang, Zijie J. and Chakravarthy, Aishwarya and Munechika, David and Chau, Duen Horng},
  year = {2024},
  url = {http://arxiv.org/abs/2401.14447},
  urldate = {2024-01-29},
  archiveprefix = {arxiv},
  journal = {arXiv 2401.14447}
}
```

## License

The software is available under the [MIT License](https://github.com/poloclub/wordflow/blob/main/LICENSE).

## Contact

If you have any questions, feel free to [open an issue](https://github.com/poloclub/wordflow/issues/new) or contact [Jay Wang](https://zijie.wang).
