import AppKit

// Vector-drawn app icon; generated at each native icon resolution.
let folder = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
for size in [16, 32, 128, 256, 512] {
    for scale in [1, 2] {
        let pixels = size * scale
        let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels,
                                      bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                      isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
        let transform = NSAffineTransform()
        transform.scale(by: CGFloat(pixels) / 1024)
        transform.concat()
        let shape = NSBezierPath(roundedRect: NSRect(x: 65, y: 65, width: 894, height: 894), xRadius: 205, yRadius: 205)
        NSColor(red: 0.09, green: 0.14, blue: 0.15, alpha: 1).setFill()
        shape.fill()
        NSColor(red: 0.56, green: 0.86, blue: 0.72, alpha: 1).setStroke()
        shape.lineWidth = 10
        shape.stroke()
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .center
        let attributes: [NSAttributedString.Key: Any] = [
            .font: NSFont.monospacedSystemFont(ofSize: 400, weight: .medium),
            .foregroundColor: NSColor(red: 0.56, green: 0.86, blue: 0.72, alpha: 1),
            .paragraphStyle: paragraph
        ]
        ("{ }" as NSString).draw(in: NSRect(x: 100, y: 290, width: 824, height: 460), withAttributes: attributes)
        if size >= 128 {
            ("JAVA" as NSString).draw(in: NSRect(x: 100, y: 190, width: 824, height: 100), withAttributes: [
                .font: NSFont.systemFont(ofSize: 76, weight: .semibold),
                .foregroundColor: NSColor.white.withAlphaComponent(0.8),
                .paragraphStyle: paragraph,
                .kern: 12
            ])
        }
        NSGraphicsContext.restoreGraphicsState()
        let suffix = scale == 2 ? "@2x" : ""
        try bitmap.representation(using: .png, properties: [:])!.write(
            to: folder.appendingPathComponent("icon_\(size)x\(size)\(suffix).png"))
    }
}
