---
title: PCB design platform
date: "2020-05-13"
template: "post"
draft: false
slug: "cadstrom-intro"
category: "Personal"
tags:
    - "Cadstrom"
    - "PCB"
description: "We have been at home self-isolating for two months now. I have been dealing with a lot of anxiety with the pandemic, but trying to stay busy and cutting down tv time has been incredibly motivating. I've spent my free time building a PCB design platform that is live at Cadstrom.io."
---

We have been at home self-isolating for two months now. I have been dealing with a lot of anxiety with the pandemic, but trying to stay busy and cutting down tv time has been incredibly motivating.

I've spent my free time building a PCB design platform that is live at [Cadstrom.io](https://cadstrom.io). I've been working on this with [@MichaelBlouin](https://twitter.com/MichaelBlouin). Our first feature set is nearing completion. It's completely free for designers and provides:

1. 📸 Image generation for schematics and boards on every change
2. ⚡ Automatic electrical and design rule checks on every change
3. 🦅 Support for EagleCAD
4. Integration with GitHub.

You can check out my [test project](https://cadstrom.io/g/Jtfinlay/Arduino_MEGA2560_Rev3) publicly without using sign in.

It has been quite the journey coming this far! I had done basic circuit design in University, but this was a complicated field to revisit and it has significant software challenges. Drawing the circuit design means parsing the same data EagleCAD parses. Building rule checks requires understanding the ins and outs of what each design rule provides.

For the image generation, I built a React package that renders the given EagleCad schematic or board. This allows our service to render the data and I will later use the same package on the web portal to provide similar behavior. Works well so far! Something I think is really cool is how we can combine the rule check and image generation to let designers present the state of their project right on Github!

[Example repo](https://github.com/Jtfinlay/Arduino_MEGA2560_Rev3). The 'design rules' tag and generated image will always match the latest changes on the master branch.

[![GitHub repo with design rule tag and generated image.](/media/2020-05-13---cadstrom-geometry/MEGA2560_Rev3e.png)](https://github.com/Jtfinlay/Arduino_MEGA2560_Rev3)

And the geometry! Design rule checks ensure there is sufficient clearance between copper components, so you have to create complex shapes and also compare the distance between them. The cad tool also shows **where** the intersection occurs, and recreating this has given me nightmares. But I enjoy graph problems and this is just one of those!

This shows the behavior I have been recreating - calculating the precise intersection of a clearance error. I'll have this drawn to the frontend at some point, but for now I need the location so that errors can be identified and approved.

![Intersection area is shown between a wire and a via.](/media/2020-05-13---cadstrom-geometry/intersectionarea.PNG)

Anyways, I hope this format makes for more posts from me in the future. Bit friendlier, bit less detailed. ✌
