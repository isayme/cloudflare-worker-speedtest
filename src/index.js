import filesizeParser from "filesize-parser";
import showdown from "showdown";

const converter = new showdown.Converter()

const maxFileSize = filesizeParser('1GB')

const defaultChunkSize = 10 * 1024 * 1024 // 10MB
const defaultChunk = new Uint8Array(defaultChunkSize)

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)

		if (url.pathname == '/') {
			return this.getHelpResponse(url.origin)
		}

		const fileName = url.pathname.slice(1)
		let fileSize = 0
		try {
			fileSize = filesizeParser(fileName)
			if (fileSize > maxFileSize) {
				return this.getHelpResponse(url.origin)
			}
		} catch (e) {
			return this.getHelpResponse(url.origin)
		}

		const { readable, writable } = new TransformStream()
		setTimeout(async () => {
			const writer = writable.getWriter()

			let chunkSize = defaultChunkSize
			let written = 0

			while (written < fileSize) {
				let n = Math.min(fileSize - written, chunkSize)
				await writer.write(defaultChunk.slice(0, n))
				written += n
			}
		}, 0)

		return new Response(readable, {
			headers: {
				'content-type': 'application/octet-stream',
				'content-disposition': `attachment;filename="${fileName}.bin"`
			}
		})
	},

	getHelpResponse(origin) {
		const helpHtml = converter.makeHtml(`
This is site for speedtest, you can download file with specified size.

Try browse links like below:
- [${origin}/1KB](${origin}/1KB)
- [${origin}/10KB](${origin}/10KB)
- [${origin}/1MB](${origin}/1MB)
- [${origin}/10MB](${origin}/10MB)
- [${origin}/100MB](${origin}/100MB)
- [${origin}/200MB](${origin}/200MB)

Limits:
- file size should less then 1GB
`)

		return new Response(helpHtml, {
			status: 400,
			headers: {
				'content-type': 'text/html'
			}
		})
	}
};
