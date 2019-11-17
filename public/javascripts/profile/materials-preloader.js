async function getMaterials(status, offset) {
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
        params.append('status', status);
        params.append('offset', offset);
        request.open('POST', `/api/getMaterials`);
        request.send(params);        
    });
}

window.addEventListener('DOMContentLoaded', (event) => {

    let offset = 1;
    let malterialsSelect = document.getElementById('materials-select');
    let materialsTBody = document.getElementById('materials-tbody');
    let nextMaterialsBtn = document.getElementById('next-materials-btn');
    let prevMaterialsBtn = document.getElementById('prev-materials-btn');

    function loadMaterialsToTable() {
        getMaterials(malterialsSelect.value, offset).then(materials => {
            materialsTBody.innerHTML = '';
            for (let material of materials.items) {
                let tr = document.createElement('tr');

                let idTD = document.createElement('td');
                idTD.innerText = material.id;

                let subjectTD = document.createElement('td');
                let link = document.createElement('a');
                link.setAttribute('href', `/material?id=${material.id}`);
                link.innerText = material.subject;
                subjectTD.appendChild(link);

                let createdTD = document.createElement('td');
                createdTD.innerText = material.created;

                let statusTD = document.createElement('td');
                statusTD.innerText = material.status;

                tr.appendChild(idTD);
                tr.appendChild(subjectTD);
                tr.appendChild(createdTD);
                tr.appendChild(statusTD);

                materialsTBody.appendChild(tr);
            }
        }).catch(err => {
            M.toast({ html: `Load error: ${err.message}` });
            console.error(err.message);
        });
    }

    nextMaterialsBtn.addEventListener('click', event => {
        offset += 10;
        loadMaterialsToTable();
    });

    prevMaterialsBtn.addEventListener('click', event => {
        offset -= 10;
        loadMaterialsToTable();
    });

    malterialsSelect.addEventListener('change', event => {
        offset = 1;
        loadMaterialsToTable();
    });

    loadMaterialsToTable();

    
});