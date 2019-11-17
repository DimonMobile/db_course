window.addEventListener('DOMContentLoaded', (event) => {
    let postCommentBtn = document.getElementById('post-comment-btn');
    let commentTextArea = document.getElementById('comment-textarea');
    let fetchBtn = document.getElementById('fetch-more-btn');
    let fetchPreloader = document.getElementById('fetch-preloader');
    let idField = document.getElementById('id-field');
    let commentsRow = document.getElementById('comments-row');
    let offset = 1;

    function enableFetchBtn(state) {
        if (state) {
            fetchBtn.classList.remove('hide');
            fetchPreloader.classList.add('hide');
        } else {
            fetchBtn.classList.add('hide');
            fetchPreloader.classList.remove('hide');
        }
    }

    function createCommentElement(id, nickname, picturepath, content, created) {
        let rootElement = document.createElement('li');
        rootElement.classList.add('collection-item');
        rootElement.classList.add('avatar');

        let imgElement = document.createElement('img');
        imgElement.classList.add('circle');
        imgElement.setAttribute('src', `/images/avatars/${picturepath}`);
        rootElement.appendChild(imgElement);

        let spanElement = document.createElement('a');
        spanElement.setAttribute('href', `/profile/information?id=${id}`);
        spanElement.classList.add('title');
        spanElement.classList.add('flow-text');
        spanElement.innerText = nickname;
        rootElement.appendChild(spanElement);

        let pElement = document.createElement('p');
        pElement.innerText = content;
        rootElement.appendChild(pElement);

        let labelElement = document.createElement('label');
        labelElement.innerText = created;
        rootElement.appendChild(labelElement);

        return rootElement;
    }

    function fetchComments() {
        enableFetchBtn(false);
        let params = new URLSearchParams();
        params.append('material_id', idField.value);
        params.append('offset', offset);
        let req = new XMLHttpRequest();
        req.onload = e => {
            let resultObject = JSON.parse(req.responseText);
            if (resultObject.error !== undefined) {
                M.toast({ html: `Load error: ${resultObject.error}` });
                enableFetchBtn(true);
            } else {
                // adding elements
                for (let item of resultObject.items) {
                    let newComment = createCommentElement(item.author_id, item.nickname, item.iconPath, item.content, item.created);
                    commentsRow.appendChild(newComment);
                }
                offset += resultObject.items.length + 1;
                if (resultObject.items.length != 0) {
                    enableFetchBtn(true);
                } else {
                    fetchPreloader.classList.add('hide');
                }
            }
        };
        req.open('POST', '/api/getComments');
        req.send(params);
    }

    fetchBtn.addEventListener('click', async e => {
        fetchComments();
    });

    postCommentBtn.addEventListener('click', async e => {
        postCommentBtn.classList.add('disabled');
        let params = new URLSearchParams();
        params.append('content', commentTextArea.value);
        params.append('id', idField.value);
        let request = new XMLHttpRequest();
        request.addEventListener('load', e => {
            let respObject = JSON.parse(request.responseText);
            if (respObject.error === undefined) {
                commentTextArea.value = '';
                offset = 0;
                commentsRow.innerHTML = '';
                fetchComments();
            } else {
                M.toast({ html: `Load error: ${respObject.error}` });
            }
        });

        request.addEventListener('loadend', e => {
            postCommentBtn.classList.remove('disabled');
        });
        request.open('POST', '/api/postComment');
        request.send(params);
        
    });

    fetchComments();
});