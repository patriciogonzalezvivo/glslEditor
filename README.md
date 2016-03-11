[**GlslEditor**](https://github.com/patriciogonzalezvivo/glslEditor) is a friendly shader editor based on [Codemirror](http://codemirror.net/) compatible with [glslViewer](https://github.com/patriciogonzalezvivo/glslViewer) and [glslCanvas](https://github.com/patriciogonzalezvivo/glslCanvas) (WebGL).

![](http://patriciogonzalezvivo.com/images/glslEditor/00.gif)

Was originaly develop to work as a embebed GLSL Editor for [The Book of Shaders](http://thebookofshaders.com). But now have grown on it's on and could be use as a stand alone Web app. Also thanks to other apps of this ecosystems like [glslViewer](https://github.com/patriciogonzalezvivo/glslViewer) that runs in the RaspberryPi directly from console, [GlslEditor](https://github.com/patriciogonzalezvivo/glslEditor) interact with other projects like [OpenFrame](http://openframe.io) allowing the user to export the shaders to frames with only one button.

![](http://patriciogonzalezvivo.com/images/glslEditor/01.gif)

Depends on [GlslCanvas](https://github.com/patriciogonzalezvivo/glslCanvas) to load the WebGL shaders. So on your ```.html``` files you should add:

```
    <script type="text/javascript" src="https://rawgit.com/patriciogonzalezvivo/glslCanvas/master/build/GlslCanvas.min.js"></script>
```

Then is about including the two ```build``` files: ```css/main.css``` and ```js/glslEditor.js```:

```
    <link type="text/css" rel="stylesheet" href="https://rawgit.com/patriciogonzalezvivo/glslEditor/gh-pages/build/css/main.css">
    <script type="application/javascript" src="https://rawgit.com/patriciogonzalezvivo/glslEditor/gh-pages/build/js/glslEditor.js"></script>
```

And then you are ready to use it by passing an **DOM element** or **query selector string**, and a set of options;

```
    <body>
        <div id="glsl_editor"></div>
    </body>
    <script type="text/javascript">
        var glslEditor = new GlslEditor('#glsl_editor', { 
            canvas_size: 500,
            canvas_draggable: true,
            theme: 'monokai',
            multipleBuffers: true,
            watchHash: true,
            fileDrops: true,
            menu: true
        });
    </script>
```

This is a list of all the **options**:

| Property             | type | description  | default  |
|----------------------|------|---|-----|
| ```canvas_size```    |number| Initial square size of the shader canvas |```250```|
| ```canvas_width```   |number| Initial width of the shader canvas |```250```|
| ```canvas_height```  |number| Initial height of the shader canvas  |```250```|
| ```canvas_draggable```| bool | Enables dragging, resizing and snaping capabilities to the shader canvas |```false```|
| ```canvas_follow```  | bool | Enables the shader canvas to follow the curser |```false```|
| ```theme```  | string | Codemirror style to use on the editor |```"default"```|
| ```menu``` | bool | Adds a menu that contain: 'new', 'open', 'save' and 'share' options | ```false```|
| ```multipleBuffers``` | bool | Allows the creation of new tabs |```false```|
| ```fileDrops``` | bool | Listen to Drag&Drop events |```false```|
| ```watchHash```| bool | Listen to changes on the wash path to load files |```false```|
| ```frag_header``` | string| Adds a hidden header to every shader before compiling |```""```|
| ```frag_footer``` | string| Adds a hidden footer to every shader before compiling |```""```|

## Some of the features features

- Inline Color picker and 3D vector picker for '''vec3''

![](http://patriciogonzalezvivo.com/images/glslEditor/pickers1.gif)

- Inline Trackpad for '''vec2'''

 ![](http://patriciogonzalezvivo.com/images/glslEditor/pickers2.gif)

- Slider for floats

- Inline error display

![](http://patriciogonzalezvivo.com/images/glslEditor/error.gif)

- Breakpoints for variables

![](http://patriciogonzalezvivo.com/images/glslEditor/debugger.gif)


## TODOs

- [ ] Twitter sharing options
- [ ] Facebook sharing options

- [ ] Open modal from url, log or file

- [ ] Uniform widgets
- [ ] Time widget
- [ ] Texture inspector

## Acknowledgments

Special thanks to [Lou Huang](@saikofish). glslEditor born from learned leassons on [TangramPlay](http://tangrams.github.io/tangram-play/). His code and wizdom is all arround this project.
