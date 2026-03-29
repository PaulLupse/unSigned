import smtplib
from email.message import EmailMessage

def distribute_key(email, key):

    email_msg = EmailMessage()
    email_msg['Subject'] = 'Key for a form'
    email_msg['From'] = 'pp422820@gmail.com'
    email_msg['To'] = email
    email_msg.set_content(key)

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login('pp422820@gmail.com', 'mkjl halb dbcy zqts')
            smtp.send_message(email_msg)
    except Exception as error:
        print(error)

if __name__ == '__main__':
    distribute_key('lupsepaul2006@gmail.com', 'cevaCheie')