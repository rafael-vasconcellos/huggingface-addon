# About

This addon adds support for Hugging Face models on translator++.

## Features

Besides the tradicional engine in the Translation options, there's also a new item in the context menu containing the following:  
<br>
**Translate selected rows entirely:** Each column will contain a translation from a different model. You can choose the models in the addon options.  
<br>
**Translate selected cells with...:** Every selected cell will be translated with the selected model, without the need of going to the addon's options to manually switch between the models every time.  
<br>
<strong style="color:red">Warning: </strong>The translate selection section will translate everything in one request, if you select too much text, the translation's quality will be worse, be careful.

## Build
```bash
$ npm run build
```

## Install
copy ./dist/hugging-spaces to translator++/www/addons