import parseHtml from 'html-react-parser';
export default function Test() {
  const customHeadCode = '<meta name="google-site-verification" content="gbNLP_MFYuaMNjLIUjy0vu5tGXHe61us4Em-uPvlKqU" />';
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: customHeadCode }} />
      {parseHtml(customHeadCode)}
    </>
  );
}
