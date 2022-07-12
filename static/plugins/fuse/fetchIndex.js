/**
 * fetch index.
 * Hugo can output json search indexes. See https://gohugo.io/templates/output-formats.
 */
const fetchIndex = async () => {
  const response = await fetch("/index.json");

  if (response.ok) {
    return response.json();
  } else {
    alert("初始化索引失败，请刷新页面。");
  }
};
