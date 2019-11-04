window.onload = function() {
    // find and highlight selected item
    let pageName = document.getElementById('profile-page-name').textContent;
    for (let colElement of document.getElementsByClassName('collection-item')) {
        if (colElement.textContent === pageName) {
            colElement.classList.add('active');
            colElement.classList.add('waves-light');
            break;
        }
    }
}