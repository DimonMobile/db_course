window.addEventListener('DOMContentLoaded', (event) => {
    let xmlBtn = document.getElementById('xml-btn');
    xmlBtn.addEventListener('click', e => {
        fetch('/getXml').then(p => p.json()).then(data => {
            if (data.status === 'ok') {
                M.toast({html: 'Exported succesfully'});
            } else {
                M.toast({html: `Error: ${data.error}`});
            }
        }).catch(e => {
            M.toast({html: `Unxpected error: ${r.message}`});
        });
    });
});