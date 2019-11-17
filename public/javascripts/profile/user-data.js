window.addEventListener('DOMContentLoaded', (event) => {
    let userRoleSelect = document.getElementById('user-role');
    userRoleSelect.addEventListener('change', event => {
        let request = new XMLHttpRequest();
        request.open('POST', '/api/setUserRole');
        let query = new URLSearchParams();
        let userIdInput = document.getElementById('user-id-input');
        query.append('id', userIdInput.value);
        query.append('role', userRoleSelect.value);
        request.send(query);
    });
});