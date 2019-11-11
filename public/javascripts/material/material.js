window.addEventListener('DOMContentLoaded', (event) => {
    let previewElement = document.getElementById('preview-zone');
    previewElement.innerHTML = markdown.toHTML(previewElement.textContent);

    let images = previewElement.getElementsByTagName('img');
    for (let imageElement of images) {
        imageElement.classList.add('responsive-img');
    }
});