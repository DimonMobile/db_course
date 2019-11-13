window.addEventListener('DOMContentLoaded', (event) => {
    window.addEventListener('scroll', (event) => {
        if (window.outerHeight <= window.scrollY)
            M.toast({html: window.scrollY});    
    });
});