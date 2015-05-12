new CTC.modules.CustomSlider('#cs-slider', {
    animationCallback: function(x) {
        $('.cs-slider_result').text(x);
    }
});