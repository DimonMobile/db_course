window.addEventListener('DOMContentLoaded', (event) => {
    let indicator = document.getElementById('fetch-feed-indicator');
    let fetchBtn = document.getElementById('fetch-feed-btn');
    let feedContainer = document.getElementById('feed-container');

    let offset = 1;

    function enableControls(state) {
        if (state === false) {
            fetchBtn.classList.remove('scale-in');
            fetchBtn.classList.add('scale-out');
            indicator.classList.remove('hide');
        } else if (state === true) {
            fetchBtn.classList.add('scale-in');
            indicator.classList.add('hide');
        }
    }

    function createMateralsCards(items) {
        for (let item of items) {
            let pattern = /\((\/images\/uploads\/[a-f0-9]+)\)/;
            let matchArray = item.content.match(pattern);
            let imgSrc = '/images/backgrounds/1.jpeg';
            if (matchArray !== null && matchArray.length > 0) {
                imgSrc = matchArray[1];
            }
            console.log(imgSrc);

            let rootElement = document.createElement('div');
            rootElement.style = 'cursor: pointer';
            rootElement.setAttribute('onclick', `window.location.href="/material?id=${item.id}"`);
            rootElement.classList.add('col');
            rootElement.classList.add('s12');
            rootElement.classList.add('m6');
            rootElement.classList.add('xl4');

            let cardRoot = document.createElement('div');
            cardRoot.classList.add('card');
            cardRoot.classList.add('hoverable');

            let cardImage = document.createElement('div');
            cardImage.classList.add('card-image');

            let cardImg = document.createElement('img');
            cardImg.setAttribute('src', imgSrc);

            let cardTitleSpan = document.createElement('span');
            cardTitleSpan.classList.add('card-title');
            cardTitleSpan.textContent = item.subject;

            cardImage.appendChild(cardImg);
            cardImage.appendChild(cardTitleSpan);

            let cardContent = document.createElement('div');
            cardContent.classList.add('card-content');


            cardRoot.appendChild(cardImage);

            rootElement.appendChild(cardRoot);

            feedContainer.appendChild(rootElement);
        }
    }

    function loadItemsFromServer() {
        enableControls(false);
        let request = new XMLHttpRequest();
        request.addEventListener('load', e => {
            let itemsObject = JSON.parse(request.responseText);
            if (itemsObject.error !== undefined) {
                M.toast({html: itemsObject.error});
                return;
            }
            let itemsLength = itemsObject.items.length;
            if (itemsLength < 10) {
                fetchBtn.classList.add('hide');
            }
            offset += 10;
            createMateralsCards(itemsObject.items);
        });

        request.addEventListener('loadend', e => {
            enableControls(true);
        });

        request.addEventListener('error', e => {
            M.toast({html: 'Load error'});
        });

        request.open('POST', '/api/getFeed');
        let params = new URLSearchParams();
        params.append('offset', offset);
        request.send(params);
    }

    fetchBtn.addEventListener('click', e => {
        loadItemsFromServer();  
    });

    loadItemsFromServer();
});