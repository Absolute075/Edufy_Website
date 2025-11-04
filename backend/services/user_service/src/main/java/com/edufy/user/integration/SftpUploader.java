package com.edufy.user.integration;

import lombok.extern.slf4j.Slf4j;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.common.IOUtils;
import net.schmizz.sshj.connection.channel.direct.Session;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;
import net.schmizz.sshj.userauth.keyprovider.KeyProvider;
import net.schmizz.sshj.xfer.InMemorySourceFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class SftpUploader {

    @Value("${STORAGE_SFTP_HOST:${storage.sftp.host:}}")
    private String host;

    @Value("${STORAGE_SFTP_PORT:${storage.sftp.port:22}}")
    private int port;

    @Value("${STORAGE_SFTP_USER:${storage.sftp.user:}}")
    private String user;

    @Value("${STORAGE_SFTP_KEY_PATH:${storage.sftp.keyPath:/app/ssh/id_rsa}}")
    private String keyPath;

    @Value("${STORAGE_SFTP_KEY_PASSPHRASE:${storage.sftp.keyPassphrase:}}")
    private String keyPassphrase;

    @Value("${STORAGE_SFTP_DEST_DIR:${storage.sftp.destDir:/var/www/Edufy_Website/storage/avatars}}")
    private String destDir;

    public void upload(InputStream in, String remoteFileName) throws IOException {
        SSHClient ssh = new SSHClient();
        // WARNING: PromiscuousVerifier disables host key verification; consider configuring known_hosts in prod
        ssh.addHostKeyVerifier(new PromiscuousVerifier());
        ssh.connect(host, port);
        try {
            KeyProvider keys = keyPassphrase != null && !keyPassphrase.isBlank()
                    ? ssh.loadKeys(keyPath, keyPassphrase)
                    : ssh.loadKeys(keyPath);
            ssh.authPublickey(user, keys);

            try (SFTPClient sftp = ssh.newSFTPClient()) {
                String remotePath = normalize(destDir) + "/" + remoteFileName;
                sftp.mkdirs(normalize(destDir));
                byte[] data = IOUtils.readFully(in).toByteArray();
                InMemorySourceFile src = new InMemorySourceFile() {
                    @Override
                    public String getName() { return remoteFileName; }
                    @Override
                    public long getLength() { return data.length; }
                    @Override
                    public InputStream getInputStream() { return new ByteArrayInputStream(data); }
                };
                sftp.put(src, remotePath);
                log.info("Uploaded avatar to {} via SFTP", remotePath);
            }
        } finally {
            try { ssh.disconnect(); } catch (Exception ignored) {}
        }
    }

    private String normalize(String p){
        if (p == null) return "";
        return p.endsWith("/") ? p.substring(0, p.length()-1) : p;
    }
}
