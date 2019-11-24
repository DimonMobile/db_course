window.addEventListener('DOMContentLoaded', (event) => {
    let btns = document.getElementsByClassName('notification-btn');
    let search = document.getElementById('search');

    search.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            window.location.href = `/search?q=${encodeURIComponent(search.value)}`;
        }
    });

    for (let btn of btns) {
        btn.addEventListener('click', e => {
            let req = new XMLHttpRequest();
            req.addEventListener('load', e => {
                let parsed = JSON.parse(req.responseText);
                if (parsed.items === undefined) {
                    M.toast({html: 'Load error'});
                    return;
                }
                for (let item of parsed.items) {
                    M.toast({html: item.content});
                }
            });
            req.open('POST', '/api/getNotifications');
            req.send();
        });
    }
});