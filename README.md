<h1>hugo-theme-pulchraCMS</h1>

hugo-theme-pulchraCMS a simple, minimal and responsive Hugo Theme. hugo-theme-pulchraCMS is well organized,
well-formatted and named accordingly so it’s easy to change any and all of the design. hugo-theme-pulchraCMS is
built with Bootstrap 4. You can customize it very easy to fit your needs.

## Table of Contents

- [Demo](#demo)
- [Installation](#installation)
- [Main Features](#features)
- [Support](#support)
- [Shortcode](#shortcode)

## Demo

[https://openv2x.org/](https://openv2x.org/)

![demo](/static/demo.png)

## Installation

1. Add the repository into your Hugo Project repository as a submodule,
   `git submodule add git@github.com:open-v2x/hugo-theme-pulchraCMS.git themes/hugo-theme-pulchraCMS`.
2. Copy the `data`, `content`, `static`, `resources` & `config.toml` files from the
   `exampleSite` directory and paste it on you Hugo Project repository/directory. From the site home
   directory:

   cp -a themes/hugo-theme-pulchraCMS/exampleSite/\* .

3. Build your site with `hugo serve` and see the result at `http://localhost:1313/`.

**Make sure to use Hugo Extended to serve/build your site, as else the SASS/SCSS won't be rendered
correctly**

## Features

- Responsive Ready.
- Powered by Bootstrap 4.
- Blog Support.
- Well formatted code.
- Easy Customization.
- Login and Register form.
- Baidu Analytics.
- Some shortcode used in blog.
- Waterfalls flow.
- Website search by fuse.

## Shortcode

### `<video>`

1. The video is in .mp4 format by default. If it is a video in other formats, please add the
   parameter type.
2. The video size defaults to 50% of the window's width, and supports custom width or height.

The usage is as follows：

{{< video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm" >}}

{{< video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
style="width: 300px">}}

### `<download />`

support add download link in markdown

上海开源信息技术协{{<download src="/joinus/OpenV2X_社区章程（草案）.pdf" text="社区章程">}}上海开源信息技术协

### `<img />`

support custom img styles in markdown

{{< img src="/images/news/news-03/image1.png" style="width: 90%">}}
