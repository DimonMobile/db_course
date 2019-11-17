async function getUsers(offset) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.addEventListener('load', e => {
            let resultObject = JSON.parse(request.responseText);
            if (resultObject.error !== undefined) {
                reject(new Error(resultObject.error));
            } else {
                resolve(resultObject);
            }
        });

        request.addEventListener('error', e => {
            reject(new Error('Load metarials error.'));
        });

        let params = new URLSearchParams();
        params.append('offset', offset);
        request.open('POST', `/api/getUsers`);
        request.send(params);        
    });
}

window.addEventListener('DOMContentLoaded', (event) => {

    let offset = 1;
    let usersTBody = document.getElementById('users-tbody');
    let nextBtn = document.getElementById('next-users-btn');
    let prevBtn = document.getElementById('prev-users-btn');

    function loadUsersToTable() {
        getUsers(offset).then(users => {
            usersTBody.innerHTML = '';
            for (let currentUser of users.items) {
                let tr = document.createElement('tr');

                let idTD = document.createElement('td');
                idTD.innerText = currentUser.id;

                let nicknameTD = document.createElement('td');
                let link = document.createElement('a');
                link.setAttribute('href', `/profile/information?id=${currentUser.id}`);
                link.innerText = currentUser.nickname;
                nicknameTD.appendChild(link);

                let emailTD = document.createElement('td');
                emailTD.innerText = currentUser.email;

                let roleTD = document.createElement('td');
                roleTD.innerText = currentUser.role;

                let createdTD = document.createElement('td');
                createdTD.innerText = currentUser.created;

                tr.appendChild(idTD);
                tr.appendChild(nicknameTD);
                tr.appendChild(emailTD);
                tr.appendChild(roleTD);
                tr.appendChild(createdTD);

                usersTBody.appendChild(tr);
            }
        }).catch(err => {
            M.toast({ html: `Load error: ${err.message}` });
            console.error(err.message);
        });
    }

    loadUsersToTable();

    nextBtn.addEventListener('click', event => {
        offset += 10;
        loadUsersToTable(); 
    });

    prevBtn.addEventListener('click', event => {
        offset -= 10;
        loadUsersToTable();
    });
});